 const mysql=require("mysql2");

 const db=mysql.createConnection({
    host:'sql12.freesqldatabase.com',
    password:'7hS1lbmBYp',
    user:'sql12752618',
    database:'sql12752618'
 });

 db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});
 module.exports = db;
