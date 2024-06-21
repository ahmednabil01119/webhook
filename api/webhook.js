const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyParser.json());

const uri = "your_mongodb_connection_string";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const trackedNumber = "+15556283187"; // The tracked WhatsApp numberv

app.post('/api/webhook', async (req, res) => {
  const data = req.body;
  console.log("Received data:", JSON.stringify(data, null, 2));

  const messagesLog = [];

  // Log incoming messages
  for (const entry of data.entry) {
    for (const change of entry.changes) {
      for (const message of change.value.messages || []) {
        const fromNumber = message.from;
        const messageText = message.text ? message.text.body : "";

        if (fromNumber === trackedNumber) {
          const messageLog = {
            direction: "incoming",
            phone_number: fromNumber,
            message: messageText,
            timestamp: new Date()
          };
          messagesLog.push(messageLog);
          console.log("Logged incoming message:", messageLog);
        }
      }
    }
  }

  // Save the logs to MongoDB
  try {
    await client.connect();
    const database = client.db('whatsapp_logs');
    const collection = database.collection('messages');
    const result = await collection.insertMany(messagesLog);
    console.log(`${result.insertedCount} messages were inserted`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }

  // Return the log for viewing in the Vercel console
  res.json({
    status: "success",
    messages: messagesLog
  });
});

module.exports = app;
