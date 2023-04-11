const {
  getCategories,
  postCategories,
} = require('../controllers/categoryControllers')

const categoryRouter = require('express').Router()

categoryRouter.route('/').get(getCategories).post(postCategories)

module.exports = categoryRouter
