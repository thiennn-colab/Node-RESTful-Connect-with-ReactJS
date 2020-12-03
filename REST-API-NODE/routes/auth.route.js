const express = require('express')
const {body} = require('express-validator')
const userModel = require('../models/user.model')
const authCtrl = require('../controllers/auth.controller')

const router = express.Router()

router.put(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter an email')
            .custom((value, { req }) => {
                return userModel.findOne({ email: value }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email address already exists!')
                    }
                    return true
                })
            })
            .normalizeEmail()
        ,
        body('name')
            .trim()
            .notEmpty()
        ,
        body('password')
            .trim()
            .isLength({ min: 6 })
    ],
    authCtrl.signup
)

router.post('/login', authCtrl.login)


module.exports = router