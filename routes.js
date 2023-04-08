const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

router.get('/reviews', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE id < 10');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error, 'help');
    res.status(500).send('An error occurred while fetching reviews');
  }
});

module.exports = router;
