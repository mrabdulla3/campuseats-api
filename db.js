 const mysql=require("mysql2");
 require('dotenv').config();
 const db=mysql.createConnection({
    host:process.env.DB_HOST,
    password:process.env.DB_PASSWORD,
    user:process.env.DB_USER,
    database:process.env.DB_NAME
 });

 db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});
 module.exports = db;
