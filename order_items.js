const express = require("express");
const router = express.Router();
const db = require("./db");

//get ordered items/cart
//http://localhost:4000/order_items/
router.get("/", async (req, res) => {
  try {
    const response = await db
      .promise()
      .query("SELECT * FROM campuseats.order_items");
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(400).json(e);
  }
});
// add item in cart
//http://localhost:4000/order_items/add-to-cart
router.post("/add-to-cart", async (req, res) => {
  const { order_id, menu_id, quantity, price } = req.body;
  try {
    const [menuItem] = await db
      .promise()
      .query("SELECT price FROM menu WHERE id = ?", [menu_id]);

    if (menuItem.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const price = menuItem[0].price;
    const total_price = price * quantity;

    const query = `
         INSERT INTO cart (user_id, menu_id, quantity, price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           quantity = quantity + VALUES(quantity),
           price = total_price + VALUES(price);
       `;

    await db.promise().query(query, [user_id, menu_id, quantity, price]);

    res.status(200).json({
      message: "Item added to cart successfully",
    });
  } catch (e) {
    res.status(400).json(e);
  }
});

//http://localhost:4000/order_items/remove-item:id
router.delete("/remove-item:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await db
      .promise()
      .query(`DELETE FROM campuseats.order_items WHERE id=${id}`);
    res.status(200).json({
      message: "Item added to cart successfully",
    });
  } catch (e) {
    res.status(400).json(e);
  }
});

module.exports = router;
