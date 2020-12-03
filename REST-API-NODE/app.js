const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')
const IO = require('socket.io')

const app = express()

//file upload

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getFullYear().toString() + new Date().getDate() + new Date().getMilliseconds() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    }
    else {
        cb(null, false)
    }
}


//routes
const feedRoutes = require('./routes/feed.route')
const authRoutes = require('./routes/auth.route')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})
app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)


// error handling
app.use((error, req, res, next) => {
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data
    res.status(status).json({ message: message, data: data })
})


mongoose.connect(
    'mongodb://localhost:27017/Feed',
    { useUnifiedTopology: true, useNewUrlParser: true}
    )
    .then(result => {
        const server = app.listen(8080)
        const io = require('./socket').init(server)
        io.on('connection', socket => {
            console.log('Client connected')
        })
    })
    .catch(err => console.log(err))