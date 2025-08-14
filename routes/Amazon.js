const express = require('express');
const router = express.Router();
const fetch = global.fetch; // Node 18+
const BouncedEmail = require('../models/BouncedEmail');

router.post("/ses/notifications", async (req, res) => {
  try {
    const messageType = req.header("x-amz-sns-message-type");

    // Parse raw body (SNS can send plain text)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        // keep as string if not JSON
      }
    }

    // Subscription confirmation
    if (messageType === "SubscriptionConfirmation") {
      const { SubscribeURL } = body;
      if (SubscribeURL) {
        console.log("Confirming subscription with:", SubscribeURL);
        await fetch(SubscribeURL);
        return res.status(200).send("Subscription confirmed");
      }
    }

    // Notification
    if (messageType === "Notification") {
      let messageContent = body.Message;
      try {
        messageContent = JSON.parse(body.Message);
      } catch (err) {
        // keep as string if not JSON
      }

      console.log("Received SNS Notification:", messageContent);

      // Handle Bounce
      if (messageContent?.notificationType === "Bounce") {
        messageContent.bounce.bouncedRecipients.forEach(async (recipient) => {
          console.log("Bounced email:", recipient.emailAddress);
          try {
            await BouncedEmail.create({
              email: recipient.emailAddress,
              type: "Bounce",
              reason: messageContent.bounce.bounceType
            });
          } catch (err) {
            console.error("Error saving bounced email:", err);
          }
        });
      }

      // Handle Complaint
      if (messageContent?.notificationType === "Complaint") {
        messageContent.complaint.complainedRecipients.forEach(async (recipient) => {
          console.log("Complaint email:", recipient.emailAddress);
          try {
            await BouncedEmail.create({
              email: recipient.emailAddress,
              type: "Complaint",
              reason: messageContent.complaint.complaintFeedbackType
            });
          } catch (err) {
            console.error("Error saving complaint email:", err);
          }
        });
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing SNS message:", err);
    res.status(500).send("Error");
  }
});

module.exports = router;
