const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");
const router = express.Router();
const jwt = require("jsonwebtoken");
require('dotenv').config();

//signup for customers
//http://localhost:4000/users/signup-customer
router.post("/signup-customer", async (req, res) => {
  const { name, email, password, userType } = req.body;

  try {
    const [existingCustomer] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingCustomer.length > 0) {
      return res.status(400).json({ error: "Customer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .promise()
      .query(
        "INSERT INTO users (name, email, password, userType) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userType]
      );

    res.status(201).json({ message: "Customer registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//For both user and vendors
//http://localhost:4000/users/login
// For user, vendors, and delivery boy login
// POST http://localhost:4000/users/login


// for delivery
//curl -X POST http://localhost:4000/users/login -H "Content-Type: application/json" -d "{\"email\": \"john.doe@example.com\", \"password\": \"securepassword123\"}"


// for user
//curl -X POST http://localhost:4000/users/login -H "Content-Type: application/json" -d "{\"email\": \"tush@gmail.com\", \"password\": \"Tushar\"}"


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;

    // Check for user in the users table (customer)
    const [customer] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);
    if (customer.length > 0) {
      user = customer[0];
    }

    // Check for vendor in the vendors table
    if (!user) {
      const [vendor] = await db
        .promise()
        .query("SELECT * FROM vendors WHERE email = ?", [email]);
      if (vendor.length > 0) {
        user = vendor[0];
      }
    }

    // Check for delivery boy in the delivery table
    if (!user) {
      const [deliveryBoy] = await db
        .promise()
        .query("SELECT * FROM delivery WHERE email = ?", [email]);
      if (deliveryBoy.length > 0) {
        user = deliveryBoy[0];
      }
    }

    // If no user found
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Respond with success and user info
    res.status(200).json({
      message: "Login successful",
      token,
      userType: user.userType,
      id: user.id, // add id to response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//http://localhost:4000/users/customer-profile/1
router.get("/customer-profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await db.promise().query("SELECT * FROM users");
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(404).json(e);
  }
});

//http://localhost:4000/users/profile-update
router.put("/profile-update", async (req, res) => {
  const { id, name, phone, address, currentPassword } = req.body;
  try {
    const query = `
      UPDATE users 
      SET 
        name = ?, 
        password = ?, 
        phone = ?, 
        address = ?, 
      WHERE id = ?`;
    const [response] = await db
      .promise()
      .query(
        "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?",
        [name, phone, address, id]
      );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (e) {
    console.error("Error updating profile:", e.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

//http://localhost:4000/users/customer-profile-delete:id=
router.delete("/customer-profile-delete:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [response] = await db
      .promise()
      .query(`DELETE FROM users WHERE id=${id}`);
    if (response.affectedRows === 0) {
      return res.status(404).json({ message: "Customer profile not found" });
    }
    res.status(200).json({
      message: "Customer profile deleted successfully",
    });
  } catch (e) {
    res.status(404).json(e);
  }
});
//http://localhost:4000/users/profile
router.get("/profile", (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const userType = decoded.userType;

    let query = "";
    if (userType === "vendor") {
      query = "SELECT * FROM vendors WHERE id = ?";
    } else if (userType === "user") {
      query = "SELECT * FROM users WHERE id = ?";
    } else {
      return res.status(400).json({ message: "Invalid role in token" });
    }

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      if (userType === "vendor") {
        res.json({
          id:userId,
          userType: "vendor",
          name: user.name,
          email: user.email,
          businessName: user.business_name || "N/A",
          image: user.image || "https://via.placeholder.com/100",
        });
      } else {
        res.json({
          id:userId,
          userType: "user",
          name: user.name,
          email: user.email,
          image: user.image || "https://via.placeholder.com/100",
        });
      }
    });
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
