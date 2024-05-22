const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongo')

exports.saveImageInfo = async function (image) {
    const db = getDb()
    const collection = db.collection('images')
    const result = await collection.insertOne(image)
    return result.insertedId
}

exports.getImageInfoById = async function (id) {
    const db = getDb()
    const collection = db.collection('images')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await collection.find({ _id: new ObjectId(id) })
            .toArray()
        return results[0]
    }
}
