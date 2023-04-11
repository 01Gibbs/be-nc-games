const { fetchEndpoints } = require('../models/endpointsModel')

exports.getEndpoints = (req, res, next) => {
  return fetchEndpoints()
    .then((endpoints) => res.status(200).send({ endpoints }))
    .catch((err) => next(err))
}
