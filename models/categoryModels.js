const db = require('../db/connection.js')

exports.selectCategories = () => {
  return db.query(`SELECT * FROM categories`).then(({ rows }) => rows)
}

exports.insertCategory = ({ slug, description }) => {
  return db
    .query(
      `INSERT INTO categories
            (slug, description)
         VALUES
            ($1, $2)
         RETURNING *`,
      [slug, description]
    )
    .then(({ rows }) => rows[0])
}
