const db = require('../db/connection.js')

exports.selectComments = (reviewId, limit = 10, page = 1) => {
  const offsetBy = limit * (page - 1)
  return db
    .query(
      `SELECT * FROM comments
         WHERE review_id = $1
         ORDER BY votes DESC, created_at DESC, comment_id
         LIMIT $2 OFFSET $3`,
      [reviewId, limit, offsetBy]
    )
    .then((res) => {
      return res.rows
    })
}

exports.insertComment = ({ username, body }, reviewId) => {
  return db
    .query(
      `INSERT INTO comments
        (body, author, review_id)
        VALUES
        ($1, $2, $3)
        RETURNING *;`,
      [body, username, reviewId]
    )
    .then((res) => {
      return res.rows[0]
    })
}

exports.removeComment = (commentId) => {
  return db
    .query(
      `DELETE FROM comments
     WHERE comment_id = $1
     RETURNING *`,
      [commentId]
    )
    .then((res) => {
      if (!res.rowCount) {
        return Promise.reject({ status: 404, msg: 'comment_id not found' })
      }
    })
}

exports.updateComment = (commentId, voteInc) => {
  return db
    .query(
      `UPDATE comments
     SET votes = votes + $1
     WHERE comment_id = $2
     RETURNING *`,
      [voteInc, commentId]
    )
    .then((res) => {
      if (!res.rowCount) {
        return Promise.reject({ status: 404, msg: 'Comment not found' })
      }
      return res.rows[0]
    })
}
