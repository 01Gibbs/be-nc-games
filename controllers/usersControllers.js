const { checkExists } = require('../models/checkExists')
const {
  selectUsers,
  selectUser,
  selectUserVotes,
  insertUserVote,
  updateUserVote,
  selectUserVoteCategories,
} = require('../models/usersModels')

exports.getUsers = (req, res, next) => {
  return selectUsers()
    .then((users) => res.status(200).send({ users }))
    .catch((err) => next(err))
}

exports.getUser = (req, res, next) => {
  const { username } = req.params
  return selectUser(username)
    .then((user) => res.status(200).send({ user }))
    .catch((err) => next(err))
}

exports.getUserVotes = (req, res, next) => {
  const { username } = req.params
  const checkUserExist = checkExists('users', 'username', username)
  const selectUserVotesPromise = selectUserVotes(username)
  return Promise.all([selectUserVotesPromise, checkUserExist])
    .then(([userVotes]) => res.status(200).send({ userVotes }))
    .catch((err) => next(err))
}

exports.postUserVote = (req, res, next) => {
  const { username } = req.params
  const { vote, review_id } = req.body
  let promise
  return selectUserVotes(username)
    .then((userVotes) => {
      if (
        userVotes.dislikes.includes(+review_id) ||
        userVotes.likes.includes(+review_id) ||
        userVotes.neutral.includes(+review_id)
      ) {
        promise = updateUserVote(username, review_id, vote)
      } else {
        promise = insertUserVote(username, review_id, vote)
      }
      return promise
    })
    .then((uservote) => {
      res.status(201).send({ uservote })
    })
    .catch((err) => next(err))
}

exports.getUserVoteCategories = (req, res, next) => {
  const { username } = req.params
  selectUserVoteCategories(username)
    .then((userVoteCategories) => {
      res.status(200).send({ userVoteCategories })
    })
    .catch((err) => next(err))
}
