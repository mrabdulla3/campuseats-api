const express = require('express');
const router = express.Router();
const db=require('./db');
//get category items
//http://localhost:4000/menu/category-items
router.get('/category-items', async(req, res) => {
  try{
    const {categoryName}=req.body;
    const response=await db.promise().query(`SELECT * FROM menu WHERE category = ${categoryName}`)
    res.status(200).json(response[0]);

  }catch(e){
    res.status(400).json(e);
}
});

module.exports = router;
