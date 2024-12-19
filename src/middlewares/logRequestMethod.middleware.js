export const logRequestMethod = (req, res, next) => {
  const method = req.method
  const path = req.path

  if (path.startsWith('/')) {
    console.log(`Request method for ${path}: ${method}`)
  }

  next()
}
