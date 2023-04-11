const { checkExists } = require('../models/checkExists')
const {
  selectComments,
  insertComment,
  removeComment,
  updateComment,
} = require('../models/commentsModels')

exports.getComments = (req, res, next) => {
  const { review_id } = req.params
  const { limit, p } = req.query
  const checkReviewExists = checkExists('reviews', 'review_id', review_id)
  const selectCommentsPromise = selectComments(review_id, limit, p)
  return Promise.all([selectCommentsPromise, checkReviewExists])
    .then(([comments]) => res.status(200).send({ comments }))
    .catch((err) => next(err))
}

exports.postComment = (req, res, next) => {
  const { review_id } = req.params
  return insertComment(req.body, review_id)
    .then((comment) => res.status(201).send({ comment }))
    .catch((err) => next(err))
}

exports.deleteComment = (req, res, next) => {
  const { comment_id } = req.params

  return removeComment(comment_id)
    .then(() => res.status(204).send())
    .catch((err) => next(err))
}

exports.patchComment = (req, res, next) => {
  const { comment_id } = req.params
  const { inc_votes } = req.body
  return updateComment(comment_id, inc_votes)
    .then((comment) => res.status(200).send({ comment }))
    .catch((err) => next(err))
}
