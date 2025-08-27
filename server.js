const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const NGROK_URL = "https://86135aef7d4a.ngrok-free.app/" || "http://localhost:5000";
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: "Root",               // your cloud name
  api_key: "977573288571836",       // your API key
  api_secret: "psgyxXAx_O0aweEKyn3fOvpWnYU", // your API secret
  secure: true,
});

// ✅ Multer-Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "simple_store", // optional folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});
const upload = multer({ storage });

// ✅ Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "simple_store"
});

// ✅ Fetch all products
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Add new product
app.post("/api/products", upload.fields([{ name: "image" }, { name: "gallery" }]), async (req, res) => {
  try {
    const { name, description, price, discount = 0, stock = 0, category } = req.body;
    const image = req.files["image"] ? req.files["image"][0].path : null;

    // handle multiple gallery images
    let gallery = null;
    if (req.files["gallery"]) {
      gallery = JSON.stringify(req.files["gallery"].map(f => f.path));
    }

    await db.query(
      "INSERT INTO products (name, description, price, discount, stock, category, image, gallery) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, description, price, discount, stock, category, image, gallery]
    );

    res.json({ message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding product" });
  }
});

// ✅ Update product
app.put("/api/products/:id", upload.fields([{ name: "image" }, { name: "gallery" }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discount = 0, stock = 0, category } = req.body;

    let query = "UPDATE products SET name=?, description=?, price=?, discount=?, stock=?, category=? WHERE id=?";
    let params = [name, description, price, discount, stock, category, id];

    // handle main image update
    if (req.files["image"]) {
      const image = req.files["image"][0].path;
      query = "UPDATE products SET name=?, description=?, price=?, discount=?, stock=?, category=?, image=? WHERE id=?";
      params = [name, description, price, discount, stock, category, image, id];
    }

    // handle gallery update
    if (req.files["gallery"]) {
      const gallery = JSON.stringify(req.files["gallery"].map(f => f.path));
      query = "UPDATE products SET name=?, description=?, price=?, discount=?, stock=?, category=?, image=COALESCE(image, ''), gallery=? WHERE id=?";
      params = [name, description, price, discount, stock, category, gallery, id];
    }

    await db.query(query, params);
    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating product" });
  }
});

// ✅ Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id=?", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting product" });
  }
});

// POST /api/orders - create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { productId, productName, quantity, price, total, customerPhone, status } = req.body;

    if (!productId || !productName || !quantity || !price || !total || !customerPhone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check stock availability
    const [product] = await db.query("SELECT stock FROM products WHERE id = ?", [productId]);
    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product[0].stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const createdAt = new Date();

    // Create order
    const [result] = await db.execute(
      `INSERT INTO orders (product_id, product_name, quantity, price, total, customer_phone, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, productName, quantity, price, total, customerPhone, status || 'pending', createdAt]
    );

    // Update the stock
    await db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);

    // Send back the inserted order
    const order = {
      id: result.insertId,
      productId,
      productName,
      quantity,
      price,
      total,
      customerPhone,
      status: status || 'pending',
      createdAt
    };

    res.status(201).json(order);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ Root route → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ✅ Admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "admin.html"));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🚀 Admin panel running at http://localhost:${PORT}/admin`);
});
