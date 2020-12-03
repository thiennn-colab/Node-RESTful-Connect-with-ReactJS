const { validationResult } = require('express-validator')
const PostModel = require('../models/post.model') 
const fs = require('fs')
const path = require('path')
const userModel = require('../models/user.model')
const io = require('../socket')


let getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2

    try{
        const totalItems = await PostModel.find().countDocuments()
        const posts = await PostModel.find().populate('creator').sort({createdAt: -1}).skip(perPage * (currentPage - 1)).limit(perPage)
            
        res.status(200).json({
            message: 'Fetched posts successfully!',
            posts: posts,
            totalItems: totalItems
        })
    }catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

let createPost = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.')
        error.statusCode = 422
        throw error
    }
    if (!req.file) {
        const error = new Error('No image provided.')
        error.statusCode = 422
        throw error
    }
    try {
        let creator
        const imageUrl = req.file.path.replace('\\', '/')
        const title = req.body.title
        const content = req.body.content 
        const post = new PostModel({
            title: title,
            content: content,
            imageUrl: imageUrl,
            creator: req.userId
        })
        await post.save()
        creator = await userModel.findById(req.userId)
        creator.posts.push(post)
        await creator.save()
        
        io.get().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: req.userId, name: creator.name}} })

        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: {_id: creator._id.toString(), name: creator.name}
        })
    }catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

let getPost = async (req, res, next) => {
    try {
        const postId = req.params.postId
        let post = await PostModel.findById(postId)
        
        if (!post) {
            const error = new Error('Could not find post.')
            error.statusCode = 404
            throw error
        }
        res.status(200).json({message: 'Post Fetched.', post: post})
    }catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

let updatePost = async (req, res, next) => {
    try {
        const postId = req.params.postId
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect.')
            error.statusCode = 422
            throw error
        }
        const title = req.body.title
        const content = req.body.content
        let imageUrl = req.body.image
        if (req.file) {
            imageUrl = req.file.path.replace('\\', '/')
        }
        if (!imageUrl) {
            const error = new Error('No file picked.')
            error.statusCode = 422
            throw(error)
        }
        
        let post = await PostModel.findById(postId).populate('creator')
            
        if (!post) {
            const error = new Error('Could not find post.')
            error.statusCode = 404
            throw error
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Could not edit post.')
            error.statusCode = 403
            throw error
        }
        if (imageUrl != post.imageUrl) {
            clearImage(post.imageUrl)
        }
        post.title = title
        post.content = content
        post.imageUrl = imageUrl
        result = await post.save()
        io.get().emit('posts', { action: 'update', post: result})
    
    
        res.status(200).json({message: 'Post updated!', post: post})
    }catch(err) {
        if (!err.statusCode) {
                err.statusCode = 500
            }
        next(err)
    }
}

const clearImage = imageUrl => {
    return fs.unlink(path.join(__dirname, '..', imageUrl), (err) => {
        if (err) {
            console.log(err)
        }
    })
}

let deletePost = async (req, res, next) => {
    try {
        const postId = req.params.postId
        let post = await PostModel.findById(postId)
        if (!post) {
            const error = new Error('Could not find post.')
            error.statusCode = 404
            throw error
        }
        if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Could not delete post.')
            error.statusCode = 403
            throw error
        }
        clearImage(post.imageUrl)
        await post.remove()
        let user = await userModel.findById(req.userId)
        
        user.posts.pull(postId)
        await user.save()
        
        io.get().emit('posts', { action: 'delete', post: postId })

        res.status(200).json({ message: 'Deleted post.' })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

module.exports = {
    getPosts,
    createPost,
    getPost,
    updatePost,
    deletePost
}