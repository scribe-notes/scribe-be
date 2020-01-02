const jwt = require('jsonwebtoken');

const protected = (req, res, next) => {
  if(!req.headers.authorization) {
    return res.status(401).json({message: "A required 'authorization' header is missing"});
  }
  jwt.verify(req.headers.authorization, process.env.JWT_SECRET, (err, decoded) => {
    if(err) return res.status(401).json({message: "Invalid token"});
    req.user = decoded;
    next();
  })
}

module.exports = protected;