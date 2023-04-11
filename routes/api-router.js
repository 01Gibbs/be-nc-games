const apiRouter = require('express').Router()
const { getEndpoints } = require('../controllers/endpointsController')
const reviewRouter = require('./review-router')
const categoryRouter = require('./category-router')
const commentRouter = require('./comment-router')
const userRouter = require('./user-router')

apiRouter.get('/', getEndpoints)

apiRouter.use('/reviews', reviewRouter)
apiRouter.use('/categories', categoryRouter)
apiRouter.use('/comments', commentRouter)
apiRouter.use('/users', userRouter)

module.exports = apiRouter
