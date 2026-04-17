const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/markets", require("./routes/markets"));
app.use("/api/trades", require("./routes/trades"));
app.use("/api/user", require("./routes/user"));

// Test endpoint
app.get("/api/test", async (req, res) => {
  try {
    const result = await db.query("SELECT 1 AS status");
    res.json({
      message: "Database connection successful",
      status: result.rows[0].status,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const { startScheduler } = require("./scheduler");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startScheduler();
});
