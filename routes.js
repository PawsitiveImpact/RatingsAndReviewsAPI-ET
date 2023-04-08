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
    const { page = 1, count = 5, sort, product_id } = req.query;

    if (!product_id) {
      return res.status(400).send('Missing required query parameter: product_id');
    }

    const offset = (page - 1) * count;

    let sortQuery = 'ORDER BY date DESC'; // Default sort by newest

    if (sort === 'helpful') {
      sortQuery = 'ORDER BY helpfulness DESC';
    } else if (sort === 'relevant') {
      sortQuery = `
        ORDER BY (
          0.3 * (EXTRACT(EPOCH FROM (NOW() - date)) / (60 * 60 * 24 * 365)) +
          0.5 * (helpfulness / GREATEST(helpfulness + 1, 1)) +
          0.2 * (rating / 5)
        ) DESC
      `;
    }

    const reviewQuery = `
      SELECT r.id as review_id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpfulness
      FROM reviews r
      WHERE r.product_id = $1 AND r.reported = false
      ${sortQuery}
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(reviewQuery, [product_id, count, offset]);

    const reviewIds = result.rows.map(row => row.review_id);
    const photoQuery = `
      SELECT rp.id, rp.review_id, rp.url
      FROM review_photos rp
      WHERE rp.review_id = ANY ($1)
    `;
    const photoResult = await pool.query(photoQuery, [reviewIds]);

    const reviewsWithPhotos = result.rows.map(row => {
      const photos = photoResult.rows.filter(photo => photo.review_id === row.review_id);
      return {
        ...row,
        photos,
      };
    });

    const response = {
      product: product_id,
      page: parseInt(page),
      count: parseInt(count),
      results: reviewsWithPhotos,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching reviews');
  }
});

router.get('/reviews/meta', async (res,req) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).send('Missing required parameter: product_id');
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching review metadata');
  }
});

module.exports = router;
