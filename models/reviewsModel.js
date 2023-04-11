const db = require('../db/connection.js')
exports.selectReviews = (
  category,
  sort_by = 'created_at',
  order_by = 'desc',
  limit = 10,
  page = 1
) => {
  const offsetBy = limit * (page - 1)

  let queryString = `SELECT owner, title, reviews.review_id, category, review_img_url, 
                            reviews.created_at, reviews.votes, designer, 
                            CAST(COUNT(comment_id) AS INT) AS comment_count, 
                            CAST(COUNT(*) OVER() AS INT) AS total_count
    FROM reviews
    LEFT JOIN comments ON reviews.review_id = comments.review_id
    `
  const queryParams = [limit, offsetBy]

  if (category) {
    queryString += ' WHERE reviews.category = $3'
    queryParams.push(category)
  }

  const validSortBys = [
    'owner',
    'title',
    'review_id',
    'category',
    'review_img_url',
    'created_at',
    'votes',
    'designer',
    'comment_count',
  ]
  if (!validSortBys.includes(sort_by)) {
    return Promise.reject({ status: 400, msg: 'Invalid key to sort by' })
  }

  if (!['asc', 'desc'].includes(order_by)) {
    return Promise.reject({ status: 400, msg: 'Invalid order by' })
  }

  queryString += ` GROUP BY owner, title, reviews.review_id, category, review_img_url,
    reviews.created_at, reviews.votes, designer 
    ORDER BY ${sort_by} ${order_by}, reviews.review_id ASC
    LIMIT $1 OFFSET $2`

  return db.query(queryString, queryParams).then(({ rows }) => rows)
}

exports.selectReview = (reviewId) => {
  return db
    .query(
      `SELECT reviews.*, CAST(COUNT(comment_id) AS INT) AS comment_count  FROM reviews
      LEFT JOIN comments ON reviews.review_id = comments.review_id
      GROUP BY owner, title, reviews.review_id, category, review_img_url,
      reviews.created_at, reviews.votes, designer, review_body
      HAVING reviews.review_id = $1`,
      [reviewId]
    )
    .then((res) => {
      if (!res.rowCount)
        return Promise.reject({ status: 404, msg: 'Review not found' })
      return res.rows[0]
    })
}

exports.updateReview = (reviewId, voteInc) => {
  return db
    .query(
      `UPDATE reviews
         SET votes = votes + $1
         WHERE review_id = $2
         RETURNING *`,
      [voteInc, reviewId]
    )

    .then((res) => {
      if (!res.rowCount) {
        return Promise.reject({ status: 404, msg: 'review_id not found' })
      }
      return res.rows[0]
    })
}

exports.insertReview = ({
  owner,
  title,
  review_body,
  designer,
  category,
  review_img_url,
}) => {
  const queryParams = [owner, title, review_body, designer, category]
  let queryString = `INSERT INTO reviews
                     (owner, title, review_body, designer, category`
  if (review_img_url) {
    queryString += `, review_img_url`
    queryParams.push(review_img_url)
  }
  queryString += `) VALUES ($1, $2, $3, $4, $5`
  if (review_img_url) queryString += `, $6`
  queryString += `) RETURNING *`
  return db.query(queryString, queryParams).then(({ rows }) => {
    return rows[0]
  })
}

exports.removeReview = (reviewId) => {
  return db
    .query(
      `DELETE FROM reviews
     WHERE review_id = $1
     RETURNING *`,
      [reviewId]
    )
    .then((res) => {
      if (!res.rowCount) {
        return Promise.reject({ status: 404, msg: 'review_id not found' })
      }
    })
}
