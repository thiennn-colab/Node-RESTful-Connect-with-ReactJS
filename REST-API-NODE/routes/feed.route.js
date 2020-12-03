const express = require('express')
const feedCtrl = require('../controllers/feed.controller')
const { body } = require('express-validator')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router()

router.get('/posts', authMiddleware, feedCtrl.getPosts)
router.post('/post', authMiddleware,
    [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({min: 5})
],
    feedCtrl.createPost
)
router.get('/post/:postId', authMiddleware, feedCtrl.getPost)
router.put(
    '/post/:postId', authMiddleware,
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedCtrl.updatePost
)
router.delete('/post/:postId', authMiddleware, feedCtrl.deletePost)

module.exports = router