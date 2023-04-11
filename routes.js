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
      SELECT r.id as review_id, r.rating, r.summary, r.recommend, r.response, r.body, to_timestamp(r.date / 1000) as date, r.reviewer_name, r.helpfulness
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
      const photos = photoResult.rows
        .filter(photo => photo.review_id === row.review_id)
        .map(photo => ({
          id: photo.id,
          url: photo.url,
      }));
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

router.get('/reviews/meta', async (req,res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).send('Missing required parameter: product_id');
    }

    const ratingsQuery = `
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE product_id = $1 AND reported = false
      GROUP BY rating
    `;

    const ratingsResult = await pool.query(ratingsQuery, [product_id]);

    const recommendedQuery = `
      SELECT recommend, COUNT(*) as count
      FROM reviews
      WHERE product_id = $1 AND reported = false
      GROUP BY recommend
    `;

    const recommendedResult = await pool.query(recommendedQuery, [product_id]);

    const characteristicsQuery = `
      SELECT c.id, c.name, AVG(cr.value) as value
      FROM characteristics c
      JOIN characteristic_reviews cr ON c.id = cr.characteristic_id
      WHERE c.product_id = $1
      GROUP BY c.id, c.name
    `;
    const characteristicsResult = await pool.query(characteristicsQuery, [product_id]);

    const response = {
      product_id,
      ratings: ratingsResult.rows.reduce((acc, row) => {
        acc[row.rating] = parseInt(row.count);
        return acc;
      }, {}),
      recommended: recommendedResult.rows.reduce((acc, row) => {
        acc[row.recommend] = parseInt(row.count);
        return acc;
      }, {}),
      characteristics: characteristicsResult.rows.reduce((acc, row) => {
        acc[row.name] = {
          id: row.id,
          value: parseInt(row.value).toFixed(4),
        };
        return acc;
      }, {}),
    };

    res.status(200).json(response);

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching review metadata');
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const { product_id, rating, summary, body, recommend, name, email, photos, characteristics } = req.body;

    if (!product_id || !rating || !body || !recommend || !name || !email || !characteristics) {
      return res.status(400).send('Missing required field(s)');
    }

    const reviewQuery = `
      INSERT INTO reviews (product_id, rating, date, summary, body, recommend, reviewer_name, reviewer_email, helpfulness)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0) RETURNING id
    `;
    const reviewResult = await pool.query(reviewQuery, [product_id, rating, Date.now(), summary, body, recommend, name, email]);

    const reviewId = reviewResult.rows[0].id;
    const photoQuery = `
      INSERT INTO review_photos (review_id, url) VALUES
      ${photos.map((_, index) => `(${reviewId}, $${index + 1})`).join(', ')}
    `;
    await pool.query(photoQuery, photos);

    const characteristicQuery = `
      INSERT INTO characteristic_reviews (characteristic_id, review_id, value) VALUES
      ${Object.entries(characteristics).map(([id, value]) => `(${id}, ${reviewId}, ${value})`).join(', ')}
    `;
    await pool.query(characteristicQuery);

    res.status(201).send('Review added');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while adding the review');
  }
});

router.put('/reviews/:review_id/helpful', async (req, res) => {
  try {
    const { review_id } = req.params;

    const helpfulQuery = `
      UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = $1
    `;
    await pool.query(helpfulQuery, [review_id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while marking the review as helpful');
  }
});

router.put('/reviews/:review_id/report', async (req, res) => {
  try {
    const { review_id } = req.params;

    const reportQuery = `
      UPDATE reviews SET reported = true WHERE id = $1
    `;
    await pool.query(reportQuery, [review_id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while reporting the review');
  }
});

module.exports = router;
