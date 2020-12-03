const jwt = require('jsonwebtoken')


module.exports = (req, res, next) => {
    let token = req.header('Authorization')
    if (!token) {
        const error = new Error('Not authenticated.')
        error.statusCode = 401
        throw error
    }
    token = token.split(' ')[1]
    let decodedToken
    try {
        decodedToken = jwt.verify(token, 'ThienSecret')
    } catch (err) {
        err.statusCode = 500
        throw err
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated.')
        error.statusCode = 401
        throw error
    }

    req.userId = decodedToken.userId
    next()
}