// server/scheduler.js
const db = require('./db/db');

/**
 * Execute an admin-provided JS resolution script.
 * The script must return (or resolve to) the string "YES" or "NO".
 * fetch() is available inside the script.
 * Timeout: 15 seconds.
 */
async function executeResolutionScript(script) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  // Wrap the script so it is the return value of an async function
  const fn = new AsyncFunction('fetch', '"use strict";\nreturn (' + script + ');');
  const result = await Promise.race([
    fn(fetch),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Resolution script timed out after 15s')), 15000)
    ),
  ]);
  const outcome = String(result).toUpperCase().trim();
  if (outcome !== 'YES' && outcome !== 'NO') {
    throw new Error('Script returned invalid outcome "' + outcome + '" — must be "YES" or "NO"');
  }
  return outcome;
}

/**
 * Check for expired markets and auto-resolve them via their resolution script.
 */
async function checkAndResolveMarkets() {
  try {
    const result = await db.query(`
      SELECT market_id, title, resolution_script
      FROM markets
      WHERE status = 'active'
        AND resolution_date IS NOT NULL
        AND resolution_date <= NOW()
        AND resolution_script IS NOT NULL
        AND resolution_script <> ''
    `);

    if (result.rows.length === 0) return;

    console.log('[Scheduler] Found ' + result.rows.length + ' market(s) ready for auto-resolution.');

    for (const market of result.rows) {
      console.log('[Scheduler] Resolving: "' + market.title + '" (' + market.market_id + ')');
      try {
        const outcome = await executeResolutionScript(market.resolution_script);
        await db.query(
          "UPDATE markets SET status = 'resolved', resolved_outcome = $1 WHERE market_id = $2",
          [outcome, market.market_id]
        );
        console.log('[Scheduler] -> Resolved as ' + outcome);
      } catch (err) {
        console.error('[Scheduler] -> Failed to resolve market ' + market.market_id + ': ' + err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected error:', err);
  }
}

function startScheduler() {
  console.log('[Scheduler] Market auto-resolution scheduler started (interval: 60s)');
  // Run once immediately on startup, then every 60 seconds
  checkAndResolveMarkets();
  setInterval(checkAndResolveMarkets, 60 * 1000);
}

module.exports = { startScheduler, checkAndResolveMarkets, executeResolutionScript };
