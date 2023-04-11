const { selectCategories, insertCategory } = require('../models/categoryModels')

exports.getCategories = (req, res, next) => {
  return selectCategories()
    .then((categories) => res.status(200).send({ categories }))
    .catch((err) => next(err))
}

exports.postCategories = (req, res, next) => {
  return insertCategory(req.body)
    .then((category) => res.status(201).send({ category }))
    .catch((err) => next(err))
}
