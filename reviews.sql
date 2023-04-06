-- Create the database
CREATE DATABASE ratings_and_reviews_data;

-- Connect to the new database
\connect ratings_and_reviews_data

-- Create the reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    summary TEXT,
    recommend BOOLEAN NOT NULL,
    response TEXT,
    body TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    helpfulness INTEGER NOT NULL,
    reported BOOLEAN DEFAULT FALSE
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
