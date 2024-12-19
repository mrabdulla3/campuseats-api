const express = require("express");
const router = express.Router();
const db = require("./db");

//get menu
//http://localhost:4000/menu/
router.get("/", async (req, res) => {
  try {
    const response = await db.promise().query(`SELECT * FROM menu`);
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(400).json(e);
  }
});
//Restaurent Menu
//http://localhost:4000/menu/vendorId
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await db
      .promise()
      .query(`SELECT *FROM menu WHERE vendor_id=${id}`);
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(400).json(e);
  }
});
//post menu
////http://localhost:4000/menu/post-menu
router.post("/post-menu", async (req, res) => {
  const {
    vendor_id,
    name,
    description,
    price,
    category,
    image_url,
    availability,
    created_at,
  } = req.body;

  try {
    // Use parameterized queries to prevent SQL injection
    const result = await db.promise().query(
      `INSERT INTO menu (vendor_id, name, description, price, category, image_url, availability, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id,
        name,
        description,
        price,
        category,
        image_url,
        availability,
        created_at,
      ]
    );
    res.status(201).json({ message: "Snack added successfully!" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

////http://localhost:4000/menu/update-menu/:id=1
router.put("/update-menu/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url, availability } =
    req.body;

  try {
    const query = `
      UPDATE menu 
      SET 
        name = ?, 
        description = ?, 
        price = ?, 
        category = ?, 
        image_url = ?, 
        availability = ?
      WHERE id = ?`;

    const [response] = await db
      .promise()
      .query(query, [
        name,
        description,
        price,
        category,
        image_url,
        availability,
        id,
      ]);

    res.status(200).json({ message: "Menu item updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

////http://localhost:4000/menu/delete-menu/:id=
router.delete("/delete-menu/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await db
      .promise()
      .query(`DELETE FROM menu WHERE id=${id}`);
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

// Search API for menu items
//http://localhost:4000/menu/search-menu/pizza
router.get("/search-menu/:query", (req, res) => {
  const {query} = req.params;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  const sql = `
    SELECT * 
    FROM menu 
    WHERE name LIKE ? OR category LIKE ?
  `;
  const values = [`%${query}%`, `%${query}%`];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error." });
    }
    res.json(results);
  });
});

module.exports = router;
