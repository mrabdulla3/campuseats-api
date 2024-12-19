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

// Get all pending orders for delivery boys
// GET http://localhost:4000/delivery/pending-orders?deliveryBoyId=Id
//curl -X GET "http://localhost:4000/delivery/pending-orders?deliveryBoyId=1"


router.get("/pending-orders", async (req, res) => {
  const { deliveryBoyId } = req.query; // Get delivery boy ID from query parameters (though it's not used for filtering)

  try {
    // Query to fetch pending orders along with vendor name and customer name
    const [orders] = await db.promise().query(
      `SELECT 
         o.id AS order_id, 
         v.name AS vendor_name, 
         u.name AS customer_name, 
         o.created_at AS order_date, 
         o.total_price AS order_amount, 
         o.status AS order_status
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users u ON o.user_id = u.id
       WHERE o.status = 'pending'`
    );

    // Check if no pending orders are found
    if (orders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    // Return the fetched orders with additional details
    res.status(200).json({ pendingOrders: orders });
  } catch (err) {
    console.error("Error fetching pending orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Accept an order for delivery
// POST http://localhost:4000/delivery/accept-order
//curl -X POST http://localhost:4000/delivery/accept-order -H "Content-Type: application/json" -d '{"orderId":1,"deliveryBoyId":1}'

router.post("/accept-order", async (req, res) => {
  const { orderId, deliveryBoyId } = req.body; // Order ID and Delivery Boy ID from request

  try {
    
    const [order] = await db.promise().query(
      `SELECT * FROM orders WHERE id = ? AND status = 'pending' AND (delivery_boy_id IS NULL OR delivery_boy_id = ?)`,
      [orderId, deliveryBoyId]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found or already accepted" });
    }

   
    await db.promise().query(
      `UPDATE orders SET delivery_boy_id = ?, status = 'accepted' WHERE id = ?`,
      [deliveryBoyId, orderId]
    );

    res.status(200).json({ message: "Order accepted successfully" });
  } catch (err) {
    console.error("Error accepting order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate OTP and save it to the order
//http://localhost:4000/delivery/generate-otp
//curl -X POST http://localhost:4000/delivery/generate-otp -H "Content-Type: application/json" -d '{"orderId":1}'

router.post("/generate-otp", async (req, res) => {
  const { orderId } = req.body;

  try {

    const otp = Math.floor(100000 + Math.random() * 900000);

    const [result] = await db.promise().query(
      "UPDATE orders SET delivery_otp = ? WHERE id = ?",
      [otp, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "OTP generated successfully", otp });
    // In production, send this OTP to the delivery boy via SMS or other means
  } catch (err) {
    console.error("Error generating OTP:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
//veryfy delivery
//http://localhost:4000/delivery/verify-delivery
//curl -X POST http://localhost:4000/delivery/verify-delivery -H "Content-Type: application/json" -d '{"orderId":1,"deliveryBoyId":1,"otp":123456}'

router.post("/verify-delivery", async (req, res) => {
  const { orderId, deliveryBoyId, otp } = req.body;

  try {
    // Fetch order details
    const [order] = await db
      .promise()
      .query("SELECT * FROM orders WHERE id = ? AND delivery_boy_id = ?", [
        orderId,
        deliveryBoyId,
      ]);

    if (order.length === 0) {
      return res.status(400).json({ error: "Invalid order or delivery boy" });
    }

    if (order[0].otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark the order as delivered
    await db
      .promise()
      .query("UPDATE orders SET status = 'delivered' WHERE id = ?", [orderId]);

    // Update delivery boy revenue and delivery count
    await db
      .promise()
      .query(
        "UPDATE delivery SET revenue = revenue + 40, total_delivery = total_delivery + 1 WHERE id = ?",
        [deliveryBoyId]
      );

    res.status(200).json({ message: "Order delivered successfully" });
  } catch (err) {
    console.error("Error during delivery verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API: Verify OTP for rejection and update the status and revenue
//http://localhost:4000/delivery/reject-order
//curl -X POST http://localhost:4000/delivery/reject-order -H "Content-Type: application/json" -d '{"orderId":1,"deliveryBoyId":1,"otp":123456}'

router.post("/reject-order", async (req, res) => {
  const { orderId, deliveryBoyId, otp } = req.body;

  try {
    // Fetch order details
    const [order] = await db
      .promise()
      .query("SELECT * FROM orders WHERE id = ? AND delivery_boy_id = ?", [
        orderId,
        deliveryBoyId,
      ]);

    if (order.length === 0) {
      return res.status(400).json({ error: "Invalid order or delivery boy" });
    }

    if (order[0].otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark the order as rejected
    await db
      .promise()
      .query("UPDATE orders SET status = 'rejected' WHERE id = ?", [orderId]);

    // Update delivery boy revenue (add +20)
    await db
      .promise()
      .query(
        "UPDATE delivery SET revenue = revenue + 20 WHERE id = ?",
        [deliveryBoyId]
      );

    res.status(200).json({ message: "Order rejected successfully, revenue updated" });
  } catch (err) {
    console.error("Error during rejection process:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API: Mark order as rejected due to no response from the user
//http://localhost:4000/delivery/reject-order-no-response
//curl -X POST http://localhost:4000/delivery/reject-order-no-response -H "Content-Type: application/json" -d '{"orderId":1,"deliveryBoyId":1}'

router.post("/reject-order-no-response", async (req, res) => {
  const { orderId, deliveryBoyId } = req.body;

  try {
    // Check if the order exists and belongs to the delivery boy
    const [order] = await db
      .promise()
      .query("SELECT * FROM orders WHERE id = ? AND delivery_boy_id = ?", [
        orderId,
        deliveryBoyId,
      ]);

    if (order.length === 0) {
      return res.status(400).json({ error: "Invalid order or delivery boy" });
    }

    // Update the order status to 'rejected'
    await db
      .promise()
      .query("UPDATE orders SET status = 'rejected' WHERE id = ?", [orderId]);

    res.status(200).json({ message: "Order marked as rejected due to no response from the user" });
  } catch (err) {
    console.error("Error while rejecting order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API: Get OTP for a specific order
//http://localhost:4000/delivery/get-otp?orderId=1
//curl -X GET "http://localhost:4000/delivery/get-otp?orderId=1"

router.get("/get-otp", async (req, res) => {
  const { orderId } = req.query;  // Using query parameter for orderId

  try {
    // Validate that the order exists
    const [order] = await db
      .promise()
      .query("SELECT delivery_otp FROM orders WHERE id = ?", [orderId]);

    if (order.length === 0) {
      return res.status(400).json({ error: "Order not found" });
    }

    // Retrieve the OTP from the order
    const otp = order[0].delivery_otp;

    // Check if OTP exists for the order
    if (!otp) {
      return res.status(400).json({ error: "OTP not generated for this order" });
    }

    // Return the OTP (you can enhance this by adding expiry logic)
    res.status(200).json({ message: "OTP retrieved successfully", otp });
  } catch (err) {
    console.error("Error retrieving OTP:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API: Get revenue, total deliveries, pending, and rejected orders for a specific delivery boy
//http://localhost:4000/delivery/delivery-details?deliveryBoyId=1
//curl -X GET "http://localhost:4000/delivery/delivery-details?deliveryBoyId=1"
router.get("/delivery-details", async (req, res) => {
  const { deliveryBoyId } = req.query;  // Get deliveryBoyId from the query parameters

  try {
    // Query to get revenue and total deliveries from the delivery table
    const [deliveryDetails] = await db
      .promise()
      .query(
        `SELECT revenue, total_deliveries
         FROM delivery 
         WHERE id = ?`,
        [deliveryBoyId]
      );

    if (deliveryDetails.length === 0) {
      return res.status(400).json({ error: "Delivery boy not found" });
    }

    // Query to get the count of accepted orders from the orders table
    const [acceptedOrders] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS accepted_order_count
         FROM orders
         WHERE delivery_boy_id = ? AND status = 'accepted'`,
        [deliveryBoyId]
      );

    // Query to get the count of pending orders from the orders table
    const [pendingOrders] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS pending_order_count
         FROM orders
         WHERE delivery_boy_id = ? AND status = 'pending'`,
        [deliveryBoyId]
      );

    // Query to get the count of rejected orders from the orders table
    const [rejectedOrders] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS rejected_order_count
         FROM orders
         WHERE delivery_boy_id = ? AND status = 'rejected'`,
        [deliveryBoyId]
      );

    // Combine the results and return as response
    const result = {
      revenue: deliveryDetails[0].revenue,
      totalDeliveries: deliveryDetails[0].total_deliveries,
      acceptedOrderCount: acceptedOrders[0].accepted_order_count,
      pendingOrderCount: pendingOrders[0].pending_order_count,
      rejectedOrderCount: rejectedOrders[0].rejected_order_count,
    };

    res.status(200).json({
      message: "Delivery details retrieved successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error retrieving delivery details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
