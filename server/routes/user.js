const express = require('express');
const db = require('../db/db');
const { authenticateToken } = require('../middlewares/authRole');

const router = express.Router();

// GET /api/user/portfolio — returns positions with market titles + recent transactions
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get positions joined with market info
    const positionsResult = await db.query(`
      SELECT p.position_id, p.market_id, p.outcome, p.shares, p.avg_price,
             m.title AS market_title, m.yes_price, m.no_price, m.status AS market_status
      FROM positions p
      JOIN markets m ON p.market_id = m.market_id
      WHERE p.user_id = $1
      ORDER BY p.position_id DESC
    `, [userId]);

    // Get recent transactions
    const historyResult = await db.query(`
      SELECT t.txn_id, t.market_id, t.type, t.outcome, t.amount_credits, t.shares, t.execution_price, t.created_at,
             m.title AS market_title
      FROM transactions t
      JOIN markets m ON t.market_id = m.market_id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [userId]);

    // Get current balance
    const balanceResult = await db.query('SELECT balance FROM users WHERE user_id = $1', [userId]);

    res.json({
      balance: parseFloat(balanceResult.rows[0].balance),
      positions: positionsResult.rows.map(p => ({
        id: p.position_id.toString(),
        marketId: p.market_id.toString(),
        marketTitle: p.market_title,
        outcome: p.outcome === 'YES' ? 'Yes' : 'No',
        shares: parseFloat(p.shares),
        averagePrice: parseFloat(p.avg_price),
        currentPrice: p.outcome === 'YES' ? parseFloat(p.yes_price) : parseFloat(p.no_price),
        marketStatus: p.market_status
      })),
      history: historyResult.rows.map(t => ({
        id: t.txn_id.toString(),
        marketId: t.market_id.toString(),
        marketTitle: t.market_title,
        type: t.type,
        outcome: t.outcome === 'YES' ? 'Yes' : 'No',
        amount: parseFloat(t.amount_credits),
        shares: parseFloat(t.shares),
        timestamp: t.created_at
      }))
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
