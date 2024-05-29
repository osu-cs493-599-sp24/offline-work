const fs = require("node:fs/promises")
const amqp = require("amqplib")
const tf = require("@tensorflow/tfjs-node")
const mobilenet = require("@tensorflow-models/mobilenet")

const { queueName } = require("./lib/rabbitmq")
const { connectToDb, getDb } = require("./lib/mongo")
const { getImageInfoById, updateImageTagsById } = require("./models/image")

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
  const classifier = await mobilenet.load()
  try {
    await connectToDb()
    const connection = await amqp.connect(rabbitmqUrl)
    const channel = await connection.createChannel()
    await channel.assertQueue(queueName)

    channel.consume(queueName, async msg => {
      if (msg) {
        const id = msg.content.toString()
        const img = await getImageInfoById(id)
        console.log("== img:", img)

        const imgData = await fs.readFile(img.path)
        const tensor = tf.node.decodeImage(imgData)
        const classifications = await classifier.classify(tensor)
        console.log("== classifications:", classifications)
        const tags = classifications.filter(c => c.probability > 0.5)
          .map(c => c.className)
        console.log("== tags:", tags)
        const updated = await updateImageTagsById(id, tags)
        if (updated) {
          console.log("== Successfully added tags for image ID", id)
        }

        channel.ack(msg)
      }
    })
  } catch (e) {
    console.error("== Error:", e)
  }
}

main()
