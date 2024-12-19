const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import route files
const usersRoute = require("./customer");
const vendorsRoute = require("./vendor");
const menuRoute = require("./menu");
const ordersRoute = require("./order");
const orderItemsRoute = require("./order_items");
const categoriesRoute = require("./categories");
const deliverRoute = require("./deliver"); // Import the new deliver.js route file by tushar 

// Use routes
app.use("/users", usersRoute);
app.use("/vendors", vendorsRoute);
app.use("/menu", menuRoute);
app.use("/orders", ordersRoute);
app.use("/order_items", orderItemsRoute);
app.use("/categories", categoriesRoute);
app.use("/delivery", deliverRoute); // Use /delivery route for all delivery-related actions by tushar 

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
