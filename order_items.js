const express = require('express');
const router = express.Router();
const db=require('./db');

//get ordered items
//http://localhost:4000/order_items/
router.get('/', async(req, res) => {
   try{
    const response=await db.promise().query('SELECT * FROM campuseats.order_items');
    res.status(200).json(response[0]);
   }catch(e){
    res.status(400).json(e);
   }
});

//http://localhost:4000/order_items/remove-item:id
router.delete('/remove-item:id', async(req, res) => {
   try{
      const {id}=req.params;
    const response=await db.promise().query(`DELETE FROM campuseats.order_items WHERE id=${id}`);
    res.status(200).json(response[0]);
   }catch(e){
    res.status(400).json(e);
   }
});

module.exports = router;
