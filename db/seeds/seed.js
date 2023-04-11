const db = require('../connection')
const format = require('pg-format')
const { convertTimestampToDate, createRef, formatComments } = require('./utils')

const seed = ({ categoryData, commentData, reviewData, userData }) => {
  return db
    .query(`DROP TABLE IF EXISTS uservotes;`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS comments;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS reviews;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS users;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS categories;`)
    })
    .then(() => {
      const topicsTablePromise = db.query(`
			CREATE TABLE categories (
				slug VARCHAR PRIMARY KEY,
				description VARCHAR
			);`)
      const usersTablePromise = db.query(`
			CREATE TABLE users (
				username VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				avatar_url VARCHAR
			);`)

      return Promise.all([topicsTablePromise, usersTablePromise])
    })
    .then(() => {
      return db.query(`
			CREATE TABLE reviews (
				review_id SERIAL PRIMARY KEY,
				title VARCHAR NOT NULL,
				category VARCHAR NOT NULL REFERENCES categories(slug),
				designer VARCHAR,
				owner VARCHAR NOT NULL REFERENCES users(username),
				review_body VARCHAR NOT NULL,
				review_img_url VARCHAR DEFAULT 'https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?w=700&h=700',
				created_at TIMESTAMP DEFAULT NOW(),
				votes INT DEFAULT 0 NOT NULL
			);`)
    })
    .then(() => {
      return db.query(`
			CREATE TABLE comments (
				comment_id SERIAL PRIMARY KEY,
				body VARCHAR NOT NULL,
				review_id INT REFERENCES reviews(review_id) ON DELETE CASCADE NOT NULL,
				author VARCHAR REFERENCES users(username) NOT NULL,
				votes INT DEFAULT 0 NOT NULL,
				created_at TIMESTAMP DEFAULT NOW()
			);`)
    })
    .then(() => {
      return db.query(`
      CREATE TABLE uservotes (
        likes_id SERIAL PRIMARY KEY,
        vote INT NOT NULL,
        review_id INT REFERENCES reviews(review_id) ON DELETE CASCADE NOT NULL,
        username VARCHAR REFERENCES users(username) NOT NULL
      );`)
    })
    .then(() => {
      const insertCategoriesQueryStr = format(
        'INSERT INTO categories (slug, description) VALUES %L;',
        categoryData.map(({ slug, description }) => [slug, description])
      )
      const categoriesPromise = db.query(insertCategoriesQueryStr)

      const insertUsersQueryStr = format(
        'INSERT INTO users (username, name, avatar_url) VALUES %L;',
        userData.map(({ username, name, avatar_url }) => [
          username,
          name,
          avatar_url,
        ])
      )
      const usersPromise = db.query(insertUsersQueryStr)

      return Promise.all([categoriesPromise, usersPromise])
    })
    .then(() => {
      const formattedReviewData = reviewData.map(convertTimestampToDate)
      const insertReviewsQueryStr = format(
        'INSERT INTO reviews (title, category, designer, owner, review_body, review_img_url, created_at, votes) VALUES %L RETURNING *;',
        formattedReviewData.map(
          ({
            title,
            category,
            designer,
            owner,
            review_body,
            review_img_url,
            created_at,
            votes,
          }) => [
            title,
            category,
            designer,
            owner,
            review_body,
            review_img_url,
            created_at,
            votes,
          ]
        )
      )

      return db.query(insertReviewsQueryStr)
    })
    .then(({ rows: reviewRows }) => {
      const reviewIdLookup = createRef(reviewRows, 'title', 'review_id')
      const formattedCommentData = formatComments(commentData, reviewIdLookup)
      const insertCommentsQueryStr = format(
        'INSERT INTO comments (body, author, review_id, votes, created_at) VALUES %L;',
        formattedCommentData.map(
          ({ body, author, review_id, votes = 0, created_at }) => [
            body,
            author,
            review_id,
            votes,
            created_at,
          ]
        )
      )
      return db.query(insertCommentsQueryStr)
    })
    .then(() => {
      return db.query(`
      INSERT INTO uservotes
      (review_id, username, vote)
      VALUES 
      (1, '${userData[0].username}', 1),
      (1, '${userData[2].username}', -1),
      (2, '${userData[2].username}', 1)
      `)
    })
}

module.exports = seed
