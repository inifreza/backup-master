var jwt = require('jsonwebtoken')
const { secretKeyJWT, lifeTimeJWT } = require('../default')

exports.checkToken = (req, res, next) => {
  // Check session_token
  if (req.headers && req.headers.authorization) {
    const sessionToken = req.headers.authorization.split(' ');
    if (sessionToken[1]) {
      jwt.verify(sessionToken[1], secretKeyJWT, (err, decode) => {
        if (err) {
          req.invalidToken = true;
          next();
        }
        req.jwtData = decode;
        next();
      })
    }
  } else {
    req.jwtData = undefined
    next()
  }
}


