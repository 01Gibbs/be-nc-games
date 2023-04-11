const {
  getUsers,
  getUser,
  getUserVotes,
  postUserVote,
  getUserVoteCategories,
} = require('../controllers/usersControllers')

const userRouter = require('express').Router()

userRouter.get('/', getUsers)
userRouter.get('/:username', getUser)
userRouter.get('/:username/votes', getUserVotes)
userRouter.post('/:username/votes', postUserVote)
userRouter.get('/:username/votes/categories', getUserVoteCategories)

module.exports = userRouter
