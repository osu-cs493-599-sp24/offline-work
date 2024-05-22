const express = require('express')
const multer = require("multer")
const crypto = require("node:crypto")

const { connectToDb } = require('./lib/mongo')
const { getImageInfoById, saveImageInfo } = require('./models/image')

const app = express()
const port = process.env.PORT || 8000

const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        },
        fileFilter: (req, file, callback) => {
            callback(null, !!imageTypes[file.mimetype])
        }
    }),
})

app.use("/media/images", express.static(`${__dirname}/uploads`))

app.post("/images", upload.single("image"), async (req, res) => {
    if (req.file && req.body && req.body.userId) {
        const id = await saveImageInfo({
            userId: req.body.userId,
            filename: req.file.filename,
            path: req.file.path,
            contentType: req.file.mimetype
        })
        /*
         * Generate offline work
         */
        res.status(200).send({ id: id })
    } else {
        res.status(400).send({
            error: "Request needs 'image' and 'userId'."
        })
    }
})

app.get('/images/:id', async (req, res, next) => {
    try {
        const image = await getImageInfoById(req.params.id)
        if (image) {
            image.url = `/media/images/${image.filename}`
            delete image.path
            res.status(200).send(image)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

app.use('*', (req, res, next) => {
    res.status(404).send({
        err: "Path " + req.originalUrl + " does not exist"
    })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', (err, req, res, next) => {
    console.error("== Error:", err)
    res.status(500).send({
        err: "Server error.  Please try again later."
    })
})

connectToDb().then(() => {
    app.listen(port, () => {
        console.log("== Server is running on port", port)
    })
})
