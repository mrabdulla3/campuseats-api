const express = require('express');
const router = express.Router();
const db=require('./db');
//get orders
//http://localhost:4000/orders/
router.get('/', async(req, res) => {
    try{
        const response=await db.promise().query('SELECT * FROM campuseats.orders');
        res.status(200).json(response[0]);
    }catch(e){
        res.status(400).json(e);
    }
});

module.exports = router;
