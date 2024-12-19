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
    // Check if the email already exists in the delivery table (for unique delivery boy)
    const [existingDeliveryBoy] = await db
      .promise()
      .query("SELECT * FROM delivery WHERE email = ?", [email]);

    if (existingDeliveryBoy.length > 0) {
      return res.status(400).json({ error: "Delivery boy already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into the delivery table
    const [insertedDelivery] = await db
      .promise()
      .query(
        "INSERT INTO delivery (name, email, password, userType) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userType]
      );

    // Get the inserted delivery boy's id
    const deliveryBoyId = insertedDelivery.insertId;

    // Insert a corresponding record into the delivery_boy table
    // Using placeholder values for mobile_no, latitude, and longitude for now
    await db
      .promise()
      .query(
        "INSERT INTO delivery_boy (id, delivery_latitude, delivery_longitude) VALUES (?, ?, ?)",
        [deliveryBoyId, null, null] // Here, you can later update these values
      );

    res.status(201).json({ message: "Delivery boy registered successfully" });
  } catch (err) {
    console.error("Error during delivery boy signup:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
