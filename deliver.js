const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db"); // Your DB configuration file
const router = express.Router();
require('dotenv').config();

// Signup for delivery boy
// POST http://localhost:4000/delivery/signup-delivery-boy

//curl -X POST http://localhost:4000/delivery/signup-delivery-boy -H "Content-Type: application/json" -d "{\"name\": \"John Doe\", \"email\": \"john.doe@example.com\", \"password\": \"securepassword123\", \"userType\": \"delivery_boy\"}"
router.post("/signup-delivery-boy", async (req, res) => {
  const { name, email, password, userType } = req.body;
  console.log("Received data:", req.body);
  try {
    
    const [existingDeliveryBoy] = await db
      .promise()
      .query("SELECT * FROM delivery WHERE email = ?", [email]);

    if (existingDeliveryBoy.length > 0) {
      return res.status(400).json({ error: "Delivery boy already exists" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

  
    const [insertedDelivery] = await db
      .promise()
      .query(
        "INSERT INTO delivery (name, email, password, userType) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userType]
      );

 
    const deliveryBoyId = insertedDelivery.insertId;
    
    await db
      .promise()
      .query(
        "INSERT INTO delivery_boy (id, delivery_latitude, delivery_longitude) VALUES (?, ?, ?)",
        [deliveryBoyId, null, null]
      );

    res.status(201).json({ message: "Delivery boy registered successfully" });
  } catch (err) {
    console.error("Error during delivery boy signup:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all delivery boys data
// GET http://localhost:4000/delivery/get-all-delivery-boys
//curl -X GET http://localhost:4000/delivery/get-all-delivery-boys
router.get("/get-all-delivery-boys", async (req, res) => {
  try {

    const [deliveryBoys] = await db.promise().query("SELECT * FROM delivery");

    if (deliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys found" });
    }

    res.status(200).json({ deliveryBoys });
  } catch (err) {
    console.error("Error fetching delivery boys:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Update delivery boy details
// PUT http://localhost:4000/delivery/update-delivery-boy

//curl -X PUT http://localhost:4000/delivery/update-delivery-boy -H "Content-Type: application/json" -d "{\"id\": 1, \"name\": \"John Updated\", \"email\": \"john.updated@example.com\", \"password\": \"newpassword123\", \"mobile_no\": \"9876543210\"}"
router.put("/update-delivery-boy", async (req, res) => {
  const { id, name, email, password, mobile_no } = req.body;

  try {

    const [deliveryBoy] = await db
      .promise()
      .query("SELECT * FROM delivery WHERE id = ?", [id]);

    if (deliveryBoy.length === 0) {
      return res.status(404).json({ error: "Delivery boy not found" });
    }


    const [existingEmail] = await db
      .promise()
      .query("SELECT * FROM delivery WHERE email = ? AND id != ?", [email, id]);

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

 
    let hashedPassword = deliveryBoy[0].password; // Use the existing password if no new password is provided
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

  
    await db
      .promise()
      .query(
        "UPDATE delivery SET name = ?, email = ?, password = ?, moble_no = ? WHERE id = ?",
        [name, email, hashedPassword, mobile_no, id]
      );

    res.status(200).json({ message: "Delivery boy updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete delivery boy profile
// DELETE http://localhost:4000/delivery/delete-delivery-boy/:id
//curl -X DELETE http://localhost:4000/delivery/delete-delivery-boy/1
router.delete("/delete-delivery-boy/:id", async (req, res) => {
  const { id } = req.params;

  try {

    const [response] = await db
      .promise()
      .query("DELETE FROM delivery WHERE id = ?", [id]);

    if (response.affectedRows === 0) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }
    await db.promise().query("DELETE FROM delivery_boy WHERE id = ?", [id]);

    res.status(200).json({ message: "Delivery boy profile deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
