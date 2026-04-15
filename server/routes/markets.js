const express = require("express");
const db = require("../db/db");
const {
  authenticateToken,
  authorizeAdmin,
} = require("../middlewares/authRole");

const router = express.Router();

// GET /api/markets — active markets with filters and sorting
router.get("/", async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;
    let query = "SELECT * FROM markets WHERE status = 'active'";
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (sortBy === "endingSoon") {
      query += " ORDER BY resolution_date ASC NULLS LAST";
    } else {
      // Default: sort by volume (highest first)
      query += " ORDER BY volume DESC NULLS LAST, start_date DESC NULLS LAST";
    }

    const result = await db.query(query, params);
    res.json({ markets: result.rows });
  } catch (error) {
    console.error("Get markets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/markets/pending — admin only: get pending markets
router.get("/pending", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT m.*, u.email AS creator_email, u.username AS creator_username FROM markets m LEFT JOIN users u ON m.created_by = u.user_id WHERE m.status = 'pending' ORDER BY m.start_date DESC",
    );
    res.json({ markets: result.rows });
  } catch (error) {
    console.error("Get pending markets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/markets/admin/users — admin only: list all users
router.get(
  "/admin/users",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const result = await db.query(`
      SELECT u.user_id, u.username, u.email, u.is_admin, u.balance, u.status, u.created_at,
             COUNT(DISTINCT p.position_id) AS active_positions
      FROM users u
      LEFT JOIN positions p ON u.user_id = p.user_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `);
      res.json({ users: result.rows });
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/markets/admin/users/:userId — admin only: get a specific user's portfolio
router.get(
  "/admin/users/:userId",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const userResult = await db.query(
        "SELECT user_id, username, email, is_admin, balance, status, created_at FROM users WHERE user_id = $1",
        [userId],
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const positions = await db.query(
        `
      SELECT p.*, m.title AS market_title FROM positions p
      JOIN markets m ON p.market_id = m.market_id
      WHERE p.user_id = $1
    `,
        [userId],
      );

      const history = await db.query(
        `
      SELECT t.*, m.title AS market_title FROM transactions t
      JOIN markets m ON t.market_id = m.market_id
      WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 20
    `,
        [userId],
      );

      res.json({
        user: userResult.rows[0],
        positions: positions.rows,
        history: history.rows,
      });
    } catch (error) {
      console.error("Get admin user detail error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/markets/admin/active — admin only: get all active markets for resolution
router.get(
  "/admin/active",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT m.*, u.username AS creator_username, u.email AS creator_email FROM markets m LEFT JOIN users u ON m.created_by = u.user_id WHERE m.status = 'active' ORDER BY m.resolution_date ASC NULLS LAST",
      );
      res.json({ markets: result.rows });
    } catch (error) {
      console.error("Get active markets error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/markets/:id — specific market
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM markets WHERE market_id = $1",
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Market not found" });
    }
    res.json({ market: result.rows[0] });
  } catch (error) {
    console.error("Get market error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/markets/:id/history — price history for charts
router.get("/:id/history", async (req, res) => {
  try {
    const { timeframe } = req.query; // 1D, 1W, 1M
    let interval;
    switch (timeframe) {
      case "1D":
        interval = "1 day";
        break;
      case "1W":
        interval = "7 days";
        break;
      default:
        interval = "30 days";
        break;
    }

    const result = await db.query(
      `
      SELECT yes_price AS prob, recorded_at AS time
      FROM price_history
      WHERE market_id = $1 AND recorded_at >= NOW() - INTERVAL '${interval}'
      ORDER BY recorded_at ASC
    `,
      [req.params.id],
    );

    // Format for Recharts
    const data = result.rows.map((row) => ({
      time:
        timeframe === "1D"
          ? new Date(row.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date(row.time).toLocaleDateString(),
      prob: parseFloat(row.prob),
    }));

    // If no history, generate a single point from current market price
    if (data.length === 0) {
      const market = await db.query(
        "SELECT yes_price FROM markets WHERE market_id = $1",
        [req.params.id],
      );
      if (market.rows.length > 0) {
        data.push({
          time: new Date().toLocaleDateString(),
          prob: parseFloat(market.rows[0].yes_price),
        });
      }
    }

    res.json({ history: data });
  } catch (error) {
    console.error("Get price history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/markets — propose a new market
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      market_type,
      category,
      resolution_source,
      resolution_script,
      start_date,
      resolution_date,
      initialProbability,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const marketId = Date.now();
    const createdBy = req.user.user_id;
    const yesPrice = initialProbability || 0.5;
    const noPrice = parseFloat((1 - yesPrice).toFixed(4));

    const initialLiquidity = 1000;
    const yesPool = parseFloat((initialLiquidity * (1 - yesPrice)).toFixed(6));
    const noPool = parseFloat((initialLiquidity * yesPrice).toFixed(6));

    const insertQuery = `
      INSERT INTO markets
      (market_id, title, description, market_type, category, yes_price, no_price, liquidity, volume, resolution_source, resolution_script, status, created_by, start_date, resolution_date, yes_pool, no_pool)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, 'pending', $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      marketId,
      title,
      description,
      market_type || "binary",
      category,
      yesPrice,
      noPrice,
      initialLiquidity,
      resolution_source,
      resolution_script,
      createdBy,
      start_date || new Date().toISOString(),
      resolution_date,
      yesPool,
      noPool,
    ];

    const result = await db.query(insertQuery, values);
    res.status(201).json({ market: result.rows[0] });
  } catch (error) {
    console.error("Create market error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/markets/admin/:id/approve — admin approve market
router.post(
  "/admin/:id/approve",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { resolutionScript } = req.body;

      let query, params;
      if (resolutionScript) {
        query =
          "UPDATE markets SET status = 'active', resolution_script = $2 WHERE market_id = $1 RETURNING *";
        params = [req.params.id, resolutionScript];
      } else {
        query =
          "UPDATE markets SET status = 'active' WHERE market_id = $1 RETURNING *";
        params = [req.params.id];
      }

      const result = await db.query(query, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Market not found" });
      }
      res.json({
        message: "Market approved successfully",
        market: result.rows[0],
      });
    } catch (error) {
      console.error("Approve market error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /api/markets/admin/:id/reject — admin reject market
router.post(
  "/admin/:id/reject",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const result = await db.query(
        "UPDATE markets SET status = 'rejected' WHERE market_id = $1 RETURNING *",
        [req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Market not found" });
      }
      res.json({ message: "Market rejected", market: result.rows[0] });
    } catch (error) {
      console.error("Reject market error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /api/markets/admin/:id/resolve — admin manually resolves a market
router.post(
  "/admin/:id/resolve",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { outcome } = req.body;
      if (outcome !== "YES" && outcome !== "NO") {
        return res.status(400).json({ error: "Outcome must be YES or NO" });
      }
      const result = await db.query(
        "UPDATE markets SET status = 'resolved', resolved_outcome = $1 WHERE market_id = $2 AND status = 'active' RETURNING *",
        [outcome, req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Active market not found" });
      }
      res.json({
        message: "Market resolved as " + outcome,
        market: result.rows[0],
      });
    } catch (error) {
      console.error("Resolve market error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = router;
