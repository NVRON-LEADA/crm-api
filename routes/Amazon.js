const express = require('express');
const router = express.Router();
const https = require('https');

// Endpoint to receive SNS notifications
router.post('/ses/notifications', (req, res) => {
  const messageType = req.headers['x-amz-sns-message-type'];
  const body = req.body;

  if (messageType === 'SubscriptionConfirmation') {
    https.get(body.SubscribeURL, (response) => {
      console.log('SNS subscription confirmed!');
    });
    return res.sendStatus(200);
  }

  if (messageType === 'Notification') {
    const notification = JSON.parse(body.Message);
    console.log('Received SNS Notification:', notification);

    // Handle bounce
    if (notification.notificationType === 'Bounce') {
      notification.bounce.bouncedRecipients.forEach(recipient => {
        console.log('Bounced email:', recipient.emailAddress);
      });
    }

    // Handle complaint
    if (notification.notificationType === 'Complaint') {
      notification.complaint.complainedRecipients.forEach(recipient => {
        console.log('Complaint email:', recipient.emailAddress);
      });
    }

    // Handle delivery
    if (notification.notificationType === 'Delivery') {
      console.log('Email delivered to:', notification.delivery.recipients);
    }

    return res.sendStatus(200);
  }

  res.sendStatus(400);
});

module.exports = router;
