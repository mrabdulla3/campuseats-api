const express = require('express');
const router = express.Router();

// Define your routes
router.get('/', (req, res) => {
    res.json({ message: 'Getting all users' });
});

// Make sure you're exporting the router object
module.exports = router;
