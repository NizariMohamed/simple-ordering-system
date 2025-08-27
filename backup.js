const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const NGROK_URL = "https://86135aef7d4a.ngrok-free.app/" || "http://localhost:5000";
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "simple_store"
});

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

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

// ✅ Add new product with all fields
app.post("/api/products", upload.fields([{ name: "image" }, { name: "gallery" }]), async (req, res) => {
  try {
    const { 
      name, description, price, discount = 0, stock = 0, category,
      slug, metaDescription, tags, status = "published",
      sku, reorderPoint = 0, supplier
    } = req.body;

    const image = req.files["image"] ? `/uploads/${req.files["image"][0].filename}` : null;

    let gallery = null;
    if (req.files["gallery"]) {
      gallery = JSON.stringify(req.files["gallery"].map(f => `/uploads/${f.filename}`));
    }

    await db.query(
      `INSERT INTO products 
      (name, description, price, discount, stock, category, image, gallery, slug, metaDescription, tags, status, sku, reorderPoint, supplier) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, discount, stock, category, image, gallery, slug, metaDescription, tags, status, sku, reorderPoint, supplier]
    );

    res.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Error adding product" });
  }
});


// ✅ Update product with all fields
app.put("/api/products/:id", upload.fields([{ name: "image" }, { name: "gallery" }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, price, discount = 0, stock = 0, category,
      slug, metaDescription, tags, status, sku, reorderPoint = 0, supplier
    } = req.body;

    let query = `
      UPDATE products 
      SET name=?, description=?, price=?, discount=?, stock=?, category=?, 
          slug=?, metaDescription=?, tags=?, status=?, sku=?, reorderPoint=?, supplier=?`;
    let params = [name, description, price, discount, stock, category, slug, metaDescription, tags, status, sku, reorderPoint, supplier];

    // handle main image
    if (req.files["image"]) {
      const image = `/uploads/${req.files["image"][0].filename}`;
      query += `, image=?`;
      params.push(image);
    }

    // handle gallery
    if (req.files["gallery"]) {
      const gallery = JSON.stringify(req.files["gallery"].map(f => `/uploads/${f.filename}`));
      query += `, gallery=?`;
      params.push(gallery);
    }

    query += ` WHERE id=?`;
    params.push(id);

    await db.query(query, params);
    res.json({ message: "✅ Product updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Error updating product" });
  }
});

// ✅ Update stock when order is confirmed
app.put("/api/products/:id/update-stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    // Get current stock
    const [rows] = await db.query("SELECT stock FROM products WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentStock = rows[0].stock;
    const newStock = Math.max(0, currentStock - quantity); // Prevent negative stock

    // Update stock
    await db.query("UPDATE products SET stock = ? WHERE id = ?", [newStock, id]);
    
    res.json({ 
      message: "Stock updated successfully", 
      previousStock: currentStock,
      newStock: newStock 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating stock" });
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


// ✅ Fetch all orders
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        product_id,
        product_name,
        quantity,
        price,
        total,
        customer_phone,
        status,
        created_at AS date
      FROM orders 
      ORDER BY created_at DESC
    `);
    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Confirm order
app.put("/api/orders/:id/confirm", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("UPDATE orders SET status = 'confirmed' WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      res.send({ message: "Order confirmed successfully." });
    } else {
      res.status(404).send({ error: "Order not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to confirm order." });
  }
});

// Cancel order
app.put("/api/orders/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      res.send({ message: "Order cancelled successfully." });
    } else {
      res.status(404).send({ error: "Order not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to cancel order." });
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
