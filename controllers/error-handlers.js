exports.handle500Error = (err, req, res, next) => {
  console.log(err)
  res.status(500).send({ msg: 'Internal server error' })
}

exports.handleCustomError = (err, req, res, next) => {
  if (err.status && err.msg) {
    res.status(err.status).send({ msg: err.msg })
  } else next(err)
}

exports.handlePsqlError = (err, req, res, next) => {
  if (err.code === '22P02') {
    res.status(400).send({ msg: 'Invalid request' })
  } else if (err.code === '23503') {
    res.status(404).send({ msg: err.detail })
  } else if (err.code === '23502') {
    res.status(400).send({ msg: 'Missing key information from body' })
  } else if (err.code === '2201W') {
    res.status(400).send({ msg: 'Limit must not be negative' })
  } else if (err.code === '2201X') {
    res.status(400).send({ msg: 'Page number must not be negative' })
  } else next(err)
}

exports.handle404PathError = (req, res, next) => {
  res.status(404).send({ msg: 'Path not found' })
}
