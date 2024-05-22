const amqp = require("amqplib")

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl)
    const channel = await connection.createChannel()
    await channel.assertQueue("echo")

    channel.consume("echo", msg => {
      if (msg) {
        console.log(msg.content.toString())
        channel.ack(msg)
      }
    })
  } catch (e) {
    console.error("== Error:", e)
  }
}

main()
