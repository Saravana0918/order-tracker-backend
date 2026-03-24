require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ✅ MySQL Connection (FIXED)
// ✅ MySQL Connection (FINAL FIX)
const db = mysql.createConnection(process.env.MYSQL_PUBLIC_URL);

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ✅ API
app.get("/api/my-orders", (req, res) => {
  const email = req.query.email;

  if (!email) return res.json([]);

  const sql = `
    SELECT order_id, status 
    FROM order_progress 
    WHERE customer_email = ?
    ORDER BY updated_at DESC
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json(results);
  });
});

app.post("/webhook/order-created", express.json(), (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  const order = req.body;
  console.log("📦 Order ID:", order.id);
  console.log("📧 Email:", order.email);

  const orderId = "#" + order.id;
  const email = order.customer?.email || order.email;

  const sql = `
    INSERT INTO order_progress (order_id, customer_email, status)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [orderId, email, "design"], (err) => {
    if (err) {
      console.error("❌ DB insert error:", err);
    } else {
      console.log("✅ Order saved in DB");
    }
  });

  res.sendStatus(200);
});

app.get("/api/all-orders", (req, res) => {
  const sql = `
    SELECT order_id, customer_email, status 
    FROM order_progress
    ORDER BY updated_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json(results);
  });
});

// ✅ UPDATE STATUS API (VERY IMPORTANT)
app.post("/api/update-status", (req, res) => {
  const { order_id, status } = req.body;

  console.log("🛠 Update Request:", order_id, status);

  const sql = `
    UPDATE order_progress 
    SET status = ?, updated_at = NOW()
    WHERE order_id = ?
  `;

  db.query(sql, [status, order_id], (err, result) => {
    if (err) {
      console.error("❌ Update error:", err);
      return res.status(500).json({ error: "DB error" });
    }

    console.log("✅ Status updated in DB");
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});