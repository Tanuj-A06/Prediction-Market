const express = require("express");
const db = require("../db/db");
const { authenticateToken } = require("../middlewares/authRole");

const router = express.Router();

// POST /api/trades/buy
router.post("/buy", authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { marketId, outcome, amount } = req.body;
    const userId = req.user.user_id;

    if (!marketId || !outcome || !amount || amount <= 0) {
      return res
        .status(400)
        .json({
          error:
            "marketId, outcome (YES/NO), and a positive amount are required",
        });
    }

    const upperOutcome = outcome.toUpperCase();
    if (upperOutcome !== "YES" && upperOutcome !== "NO") {
      return res.status(400).json({ error: "Outcome must be YES or NO" });
    }

    await client.query("BEGIN");

    // 1. Check user balance
    const userResult = await client.query(
      "SELECT balance FROM users WHERE user_id = $1 FOR UPDATE",
      [userId],
    );
    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const userBalance = parseFloat(userResult.rows[0].balance);
    if (userBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2. Get market and calculate price
    const marketResult = await client.query(
      "SELECT * FROM markets WHERE market_id = $1 AND status = 'active' FOR UPDATE",
      [marketId],
    );
    if (marketResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Active market not found" });
    }

    const market = marketResult.rows[0];

    // Fallback: initialize pools from price if somehow NULL
    let yesPool =
      parseFloat(market.yes_pool) || 1000 * (1 - parseFloat(market.yes_price));
    let noPool =
      parseFloat(market.no_pool) || 1000 * parseFloat(market.yes_price);
    const k = yesPool * noPool;

    let sharesReceived, executionPrice, newYesPool, newNoPool;

    if (upperOutcome === "YES") {
      newNoPool = noPool + amount;
      newYesPool = k / newNoPool;
      sharesReceived = yesPool - newYesPool;
    } else {
      newYesPool = yesPool + amount;
      newNoPool = k / newYesPool;
      sharesReceived = noPool - newNoPool;
    }

    if (sharesReceived <= 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Insufficient liquidity for this trade" });
    }

    executionPrice = amount / sharesReceived;
    const newYesPrice = parseFloat(
      (newNoPool / (newYesPool + newNoPool)).toFixed(4),
    );
    const newNoPrice = parseFloat((1 - newYesPrice).toFixed(4));
    const newVolume = parseFloat(market.volume || 0) + amount;

    // 4. Deduct user balance
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE user_id = $2",
      [amount, userId],
    );

    // 5. Upsert position
    const positionId = Date.now();
    await client.query(
      `
      INSERT INTO positions (position_id, user_id, market_id, outcome, shares, avg_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, market_id, outcome) DO UPDATE
      SET shares = positions.shares + EXCLUDED.shares,
          avg_price = (positions.avg_price * positions.shares + EXCLUDED.avg_price * EXCLUDED.shares) / (positions.shares + EXCLUDED.shares)
    `,
      [
        positionId,
        userId,
        marketId,
        upperOutcome,
        sharesReceived,
        executionPrice,
      ],
    );

    // 6. Insert transaction
    const txnId = Date.now() + Math.floor(Math.random() * 1000);
    await client.query(
      `
      INSERT INTO transactions (txn_id, user_id, market_id, type, outcome, amount_credits, shares, execution_price)
      VALUES ($1, $2, $3, 'BUY', $4, $5, $6, $7)
    `,
      [
        txnId,
        userId,
        marketId,
        upperOutcome,
        amount,
        sharesReceived,
        executionPrice,
      ],
    );

    // 7. Update market prices and volume
    await client.query(
      "UPDATE markets SET yes_price = $1, no_price = $2, volume = $3, yes_pool = $4, no_pool = $5 WHERE market_id = $6",
      [newYesPrice, newNoPrice, newVolume, newYesPool, newNoPool, marketId],
    );

    // 8. Record price history
    const historyId = Date.now() + Math.floor(Math.random() * 10000);
    await client.query(
      `
      INSERT INTO price_history (history_id, market_id, yes_price, volume_at_time)
      VALUES ($1, $2, $3, $4)
    `,
      [historyId, marketId, newYesPrice, newVolume],
    );

    await client.query("COMMIT");

    // Get updated user balance
    const updatedUser = await db.query(
      "SELECT balance FROM users WHERE user_id = $1",
      [userId],
    );

    res.json({
      success: true,
      shares: sharesReceived,
      executionPrice,
      newBalance: parseFloat(updatedUser.rows[0].balance),
      newYesPrice,
      newNoPrice,
      newVolume,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Buy trade error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// POST /api/trades/sell
router.post("/sell", authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { marketId, outcome, shares: sellShares } = req.body;
    const userId = req.user.user_id;

    if (!marketId || !outcome || !sellShares || sellShares <= 0) {
      return res
        .status(400)
        .json({
          error: "marketId, outcome, and a positive share amount are required",
        });
    }

    const upperOutcome = outcome.toUpperCase();

    await client.query("BEGIN");

    // 1. Check user position
    const posResult = await client.query(
      "SELECT * FROM positions WHERE user_id = $1 AND market_id = $2 AND outcome = $3 FOR UPDATE",
      [userId, marketId, upperOutcome],
    );
    if (posResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Position not found" });
    }

    const position = posResult.rows[0];
    if (parseFloat(position.shares) < sellShares) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough shares to sell" });
    }

    // 2. Get market prices
    const marketResult = await client.query(
      "SELECT * FROM markets WHERE market_id = $1 AND status = 'active' FOR UPDATE",
      [marketId],
    );
    if (marketResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Active market not found" });
    }

    const market = marketResult.rows[0];

    let yesPool =
      parseFloat(market.yes_pool) || 1000 * (1 - parseFloat(market.yes_price));
    let noPool =
      parseFloat(market.no_pool) || 1000 * parseFloat(market.yes_price);
    const k = yesPool * noPool;

    let payout, executionPrice, newYesPool, newNoPool;

    if (upperOutcome === "YES") {
      newYesPool = yesPool + sellShares;
      newNoPool = k / newYesPool;
      payout = noPool - newNoPool;
    } else {
      newNoPool = noPool + sellShares;
      newYesPool = k / newNoPool;
      payout = yesPool - newYesPool;
    }

    if (payout <= 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Insufficient liquidity for this trade" });
    }

    executionPrice = payout / sellShares;
    const newYesPrice = parseFloat(
      (newNoPool / (newYesPool + newNoPool)).toFixed(4),
    );
    const newNoPrice = parseFloat((1 - newYesPrice).toFixed(4));
    const newVolume = parseFloat(market.volume || 0) + payout;

    // 4. Credit user balance
    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE user_id = $2",
      [payout, userId],
    );

    // 5. Update or delete position
    const remainingShares = parseFloat(position.shares) - sellShares;
    if (remainingShares < 0.001) {
      await client.query("DELETE FROM positions WHERE position_id = $1", [
        position.position_id,
      ]);
    } else {
      await client.query(
        "UPDATE positions SET shares = $1 WHERE position_id = $2",
        [remainingShares, position.position_id],
      );
    }

    // 6. Insert transaction
    const txnId = Date.now() + Math.floor(Math.random() * 1000);
    await client.query(
      `
      INSERT INTO transactions (txn_id, user_id, market_id, type, outcome, amount_credits, shares, execution_price)
      VALUES ($1, $2, $3, 'SELL', $4, $5, $6, $7)
    `,
      [
        txnId,
        userId,
        marketId,
        upperOutcome,
        payout,
        sellShares,
        executionPrice,
      ],
    );

    // 7. Update market
    await client.query(
      "UPDATE markets SET yes_price = $1, no_price = $2, volume = $3, yes_pool = $4, no_pool = $5 WHERE market_id = $6",
      [newYesPrice, newNoPrice, newVolume, newYesPool, newNoPool, marketId],
    );

    // 8. Price history
    const historyId = Date.now() + Math.floor(Math.random() * 10000);
    await client.query(
      `
      INSERT INTO price_history (history_id, market_id, yes_price, volume_at_time)
      VALUES ($1, $2, $3, $4)
    `,
      [historyId, marketId, newYesPrice, newVolume],
    );

    await client.query("COMMIT");

    const updatedUser = await db.query(
      "SELECT balance FROM users WHERE user_id = $1",
      [userId],
    );

    res.json({
      success: true,
      payout,
      executionPrice,
      newBalance: parseFloat(updatedUser.rows[0].balance),
      newYesPrice,
      newNoPrice,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Sell trade error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// POST /api/trades/claim
router.post("/claim", authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { marketId } = req.body;
    const userId = req.user.user_id;

    await client.query("BEGIN");

    // 1. Check market is resolved
    const marketResult = await client.query(
      "SELECT * FROM markets WHERE market_id = $1 AND status = 'resolved'",
      [marketId],
    );
    if (marketResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Market is not resolved" });
    }

    const market = marketResult.rows[0];
    const winningOutcome = market.resolved_outcome;

    // 2. Get user position for winning outcome
    const posResult = await client.query(
      "SELECT * FROM positions WHERE user_id = $1 AND market_id = $2 AND outcome = $3 FOR UPDATE",
      [userId, marketId, winningOutcome],
    );
    if (posResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No winning position to claim" });
    }

    const position = posResult.rows[0];
    const payout = parseFloat(position.shares); // Each winning share pays out 1 credit

    // 3. Credit user
    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE user_id = $2",
      [payout, userId],
    );

    // 4. Remove position
    await client.query("DELETE FROM positions WHERE position_id = $1", [
      position.position_id,
    ]);

    // 5. Transaction record
    const txnId = Date.now() + Math.floor(Math.random() * 1000);
    await client.query(
      `
      INSERT INTO transactions (txn_id, user_id, market_id, type, outcome, amount_credits, shares, execution_price)
      VALUES ($1, $2, $3, 'CLAIM', $4, $5, $6, 1)
    `,
      [
        txnId,
        userId,
        marketId,
        winningOutcome,
        payout,
        parseFloat(position.shares),
      ],
    );

    // Also delete losing positions for the same market
    await client.query(
      "DELETE FROM positions WHERE user_id = $1 AND market_id = $2 AND outcome != $3",
      [userId, marketId, winningOutcome],
    );

    await client.query("COMMIT");

    const updatedUser = await db.query(
      "SELECT balance FROM users WHERE user_id = $1",
      [userId],
    );

    res.json({
      success: true,
      payout,
      newBalance: parseFloat(updatedUser.rows[0].balance),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Claim error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
