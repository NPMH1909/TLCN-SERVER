export const logRequestTime = (req, res, next) => {
  const requestTime = new Date()
  console.log(`Request received at: ${requestTime}`)
  next()
}
