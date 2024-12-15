const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_SECRET = "campuseats@098";

//signup for customers
//http://localhost:4000/users/signup-customer
router.post("/signup-customer", async (req, res) => {
  const { name, email, password, userType } = req.body;

  try {
    const [existingCustomer] = await db
      .promise()
      .query("SELECT * FROM campuseats.users WHERE email = ?", [email]);
    if (existingCustomer.length > 0) {
      return res.status(400).json({ error: "Customer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .promise()
      .query(
        "INSERT INTO campuseats.users (name, email, password, userType) VALUES (?, ?, ?, ?)",
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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;

    // Check in customers table
    const [customer] = await db
      .promise()
      .query("SELECT * FROM customers WHERE email = ?", [email]);
    if (customer.length > 0) {
      user = customer[0];
    }

    // Check in vendors table if not found in customers
    if (!user) {
      const [vendor] = await db
        .promise()
        .query("SELECT * FROM vendors WHERE email = ?", [email]);
      if (vendor.length > 0) {
        user = vendor[0];
      }
    }

    // If user not found
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      userType: user.userType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//http://localhost:4000/users/customer-profile
router.get("/customer-profile", async (req, res) => {
  try {
    const response = await db.promise().query("SELECT * FROM campuseats.users");
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(404).json(e);
  }
});

//http://localhost:4000/users/customer-profile-update:id=
router.put("/customer-profile-update:id", async (req, res) => {
  const { id } = req.params;
  const { name, password, phone, address } = req.body;
  try {
    const query = `
      UPDATE campuseats.users 
      SET 
        name = ?, 
        password = ?, 
        phone = ?, 
        address = ?, 
      WHERE id = ?`;
    const [response] = await db
      .promise()
      .query(query, [name, password, phone, address, id]);
    res.status(200).json({ message: "Menu item updated successfully" });
  } catch (e) {
    res.status(404).json(e);
  }
});
//http://localhost:4000/users/customer-profile-delete:id=
router.delete("/customer-profile-delete:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [response] = await db
      .promise()
      .query(`DELETE FROM campuseats.users WHERE id=${id}`);
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

module.exports = router;
