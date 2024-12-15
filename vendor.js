const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");
const router = express.Router();

//Vendor signup
//http://localhost:4000/vendors/signup-vendor
router.post("/signup-vendor", async (req, res) => {
  const { name, email, password, userType } = req.body;

  try {
    const [existingCustomer] = await db
      .promise()
      .query("SELECT * FROM campuseats.vendors WHERE email = ?", [email]);
    if (existingCustomer.length > 0) {
      return res.status(400).json({ error: "Vendor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .promise()
      .query(
        "INSERT INTO campuseats.vendors (name, email, password, userType) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userType]
      );

    res.status(201).json({ message: "Customer registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//http://localhost:4000/vendors/vendor-profile
router.get("/vendor-profile", async (req, res) => {
  try {
    const response = await db
      .promise()
      .query("SELECT * FROM campuseats.vendors");
    res.status(200).json(response[0]);
  } catch (e) {
    res.status(404).json(e);
  }
});

//http://localhost:4000/vendors/vendor-profile-update:id=
router.put("/vendor-profile-update:id", async (req, res) => {
  const { id } = req.params;
  const { name, password, phone, address } = req.body;
  try {
    const query = `
        UPDATE campuseats.vendors 
        SET 
          name = ?, 
          password = ?, 
          phone = ?, 
          address = ?, 
        WHERE id = ?`;
    const [response] = await db
      .promise()
      .query(query, [name, password, phone, address, id]);
    res.status(200).json({ message: "vendor profile updated successfully" });
  } catch (e) {
    res.status(404).json(e);
  }
});
// Delete Vendor Profile API
//http://localhost:4000/vendors/vendor-profile-delete:id=1
router.delete("/vendor-profile-delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [response] = await db
      .promise()
      .query("DELETE FROM campuseats.vendors WHERE id = ?", [id]);

    if (response.affectedRows === 0) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    res.status(200).json({
      message: "Vendor profile deleted successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "An error occurred while deleting the vendor profile",
    });
  }
});

module.exports = router;
