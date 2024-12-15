 const mysql=require("mysql2");

 const db=mysql.createConnection({
    host:'localhost',
    password:'2(campuseats)@#',
    user:'campuseats',
    database:'campuseats'
 });

 db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});
 module.exports = db;
