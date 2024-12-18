const express = require("express");
const router = express.Router();
const db = require("./db");

//get ordered items/cart
//http://localhost:4000/order_items/
router.get("/", async (req, res) => {
  try {
    const response = await db
      .promise()
      .query("SELECT * FROM order_items");
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(400).json(e);
  }
});
// add item in cart
//http://localhost:4000/order_items/add-to-cart
router.post("/add-to-cart", async (req, res) => {
  const { order_id, menu_id, quantity } = req.body; // Extract necessary data
  try {
    const [menuItem] = await db
      .promise()
      .query("SELECT name,price FROM campuseats.menu WHERE id = ?", [menu_id]);

    if (menuItem.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const { name, price } = menuItem[0];
    const total_price = price * quantity;

    const query = `
      INSERT INTO campuseats.order_items (order_id,menu_id, quantity, price,item_name)
      VALUES (?,?, ?, ?,?)
      ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity),
        price = VALUES(quantity) * VALUES(price);
    `;

    await db
      .promise()
      .query(query, [order_id, menu_id, quantity, total_price, name]);

    res.status(200).json({
      message: "Item added to cart successfully",
    });
  } catch (e) {
    console.error("Error adding to cart:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//http://localhost:4000/order_items/remove-item/id
router.delete("/remove-item/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID parameter is required" });
    }

    const [result] = await db
      .promise()
      .query(`DELETE FROM order_items WHERE id=${id}`);
    res.status(200).json({
      message: "Item deleted successfully",
    });
  } catch (e) {
    console.error("Error deleting item:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
