require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function loadData() {
  try {
    const dataFilePath = path.join(__dirname, 'reviews.sql');
    const dataFileContents = fs.readFileSync(dataFilePath, 'utf-8');
    await pool.query(dataFileContents);
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

loadData();
