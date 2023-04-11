const db = require('../db/connection.js')

exports.selectUsers = () => {
  return db.query(`SELECT * FROM users`).then(({ rows }) => rows)
}

exports.selectUser = (username) => {
  return db
    .query(
      `SELECT * FROM users
         WHERE username = $1`,
      [username]
    )
    .then((result) => {
      if (!result.rowCount) {
        return Promise.reject({ status: 404, msg: `User not found` })
      }
      return result.rows[0]
    })
}

exports.selectUserVotes = (username) => {
  return db
    .query(
      `SELECT * FROM uservotes
         WHERE username = $1`,
      [username]
    )
    .then((result) => {
      const data = result.rows
      const likes = data
        .filter((info) => info.vote === 1)
        .map((info) => info.review_id)
      const dislikes = data
        .filter((info) => info.vote === -1)
        .map((info) => info.review_id)
      const neutral = data
        .filter((info) => info.vote === 0)
        .map((info) => info.review_id)
      return { likes, dislikes, neutral }
    })
}

exports.selectUserVoteCategories = (username) => {
  return db
    .query(
      `SELECT uservotes.vote, reviews.category FROM uservotes
    JOIN reviews ON reviews.review_id = uservotes.review_id
    WHERE uservotes.username = $1`,
      [username]
    )
    .then((result) => {
      const data = result.rows
      const likes = data
        .filter((info) => info.vote === 1)
        .map((info) => info.category)
      const dislikes = data
        .filter((info) => info.vote === -1)
        .map((info) => info.category)
      const neutral = data
        .filter((info) => info.vote === 0)
        .map((info) => info.category)
      return { likes, dislikes, neutral }
    })
}

exports.insertUserVote = (username, review_id, vote) => {
  return db
    .query(
      `
    INSERT INTO uservotes
    (username, vote, review_id)
    VALUES ($1, $2, $3)
    RETURNING *`,
      [username, vote, review_id]
    )
    .then(({ rows }) => {
      const { username, review_id, vote } = rows[0]
      return { username, review_id, vote }
    })
}

exports.updateUserVote = (username, review_id, vote) => {
  return db
    .query(
      `
    UPDATE uservotes
    SET vote = vote + $1
    WHERE review_id = $2 AND username = $3
    RETURNING *`,
      [vote, review_id, username]
    )
    .then(({ rows }) => {
      const { username, review_id, vote } = rows[0]
      return { username, review_id, vote }
    })
}
