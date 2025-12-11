// Optional middleware for future authentication
const auth = (req, res, next) => {
  next();
};
module.exports = auth;
