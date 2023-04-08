-- Drop tables if they exist
DROP TABLE IF EXISTS characteristic_reviews CASCADE;
DROP TABLE IF EXISTS review_photos CASCADE;
DROP TABLE IF EXISTS characteristics CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Create the reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    date BIGINT NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    recommend BOOLEAN NOT NULL,
    reported BOOLEAN DEFAULT FALSE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    response TEXT,
    helpfulness INTEGER NOT NULL
);

-- Create the photos table
CREATE TABLE review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Create the characteristics table
CREATE TABLE characteristics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL
);

-- Create the characteristic_reviews table
CREATE TABLE characteristic_reviews (
    id SERIAL PRIMARY KEY,
    characteristic_id INTEGER NOT NULL,
    review_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    FOREIGN KEY (characteristic_id) REFERENCES characteristics(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Import data for the reviews table
COPY reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
FROM '/Users/ElliottTung/Documents/Hack_Reactor/RatingsAndReviewsAPI-ET/reviews.csv' DELIMITER ',' CSV HEADER;

-- Import data for the review_photos table
COPY review_photos (id, review_id, url)
FROM '/Users/ElliottTung/Documents/Hack_Reactor/RatingsAndReviewsAPI-ET/reviews_photos.csv' DELIMITER ',' CSV HEADER;

-- Import data for the characteristics table
COPY characteristics (id, product_id, name)
FROM '/Users/ElliottTung/Documents/Hack_Reactor/RatingsAndReviewsAPI-ET/characteristics.csv' DELIMITER ',' CSV HEADER;

-- Import data for the characteristic_reviews table
COPY characteristic_reviews (id, characteristic_id, review_id, value)
FROM '/Users/ElliottTung/Documents/Hack_Reactor/RatingsAndReviewsAPI-ET/characteristic_reviews.csv' DELIMITER ',' CSV HEADER;
