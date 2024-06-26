const amqp = require("amqplib")

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
  try {
    const connection = await amqp.connect(rabbitmqUrl)
    const channel = await connection.createChannel()
    await channel.assertQueue("echo")

    const message = "The quick brown fox jumped over the lazy dog"
    message.split(" ").forEach(word => {
      channel.sendToQueue("echo", Buffer.from(word))
    })
    setTimeout(() => connection.close(), 1000)
  } catch (e) {
    console.error("== Error:", e)
  }
}

main()
