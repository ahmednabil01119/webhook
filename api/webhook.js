require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const trackedNumber = "+15556283187"; // The tracked WhatsApp number

// File to store logs
const logFile = path.join(__dirname, 'messages.log');

// Verification endpoint to handle the challenge request
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === process.env.VERIFY_TOKEN) {
    if (mode === 'subscribe') {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});

app.post('/api/webhook', (req, res) => {
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

  // Save the logs to a file
  fs.appendFile(logFile, JSON.stringify(messagesLog, null, 2) + '\n', (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    } else {
      console.log('Messages logged to file');
    }
  });

  // Return the log for viewing in the Vercel console
  res.json({
    status: "success",
    messages: messagesLog
  });
});

module.exports = app;
