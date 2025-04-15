// components/connection_final.js - Improved error handling
const mysql = require('mysql');
require("dotenv").config();

// Create a connection pool instead of a single connection for better reliability
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  connectionLimit: 10, // Maximum number of connections in the pool
  waitForConnections: true, // Wait for connections to be available
});

// Test the pool connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL database: ", err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied to database. Check credentials.');
    }
    return;
  }
  
  if (connection) {
    console.log("MySQL Successfully connected to database gee_stocks!");
    connection.release(); // Release connection back to the pool
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
});

// Export the pool instead of a single connection
module.exports = pool;