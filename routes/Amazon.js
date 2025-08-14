const express = require('express');
const router = express.Router();
const fetch = global.fetch; // Node 18+
const BouncedEmail = require('../models/BouncedEmail');

router.post("/ses/notifications", async (req, res) => {
  try {
    const messageType = req.header("x-amz-sns-message-type");
    console.log("=== New SNS Request ===");
    console.log("SNS Message Type:", messageType);
    console.log("Raw req.body:", req.body);

    // Parse raw body (SNS can send plain text)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log("Parsed body as JSON:", body);
      } catch (err) {
        console.log("Body is not JSON, keeping as string.");
      }
    }

    // Subscription confirmation
    if (messageType === "SubscriptionConfirmation") {
      const { SubscribeURL } = body;
      console.log("SubscriptionConfirmation body:", body);
      if (SubscribeURL) {
        console.log("Confirming subscription with:", SubscribeURL);
        await fetch(SubscribeURL);
        console.log("Subscription confirmed!");
        return res.status(200).send("Subscription confirmed");
      } else {
        console.log("No SubscribeURL found in body.");
      }
    }

    // Notification
    if (messageType === "Notification") {
      let messageContent = body.Message;
      console.log("Raw messageContent:", messageContent);

      try {
        messageContent = JSON.parse(body.Message);
        console.log("Parsed messageContent as JSON:", messageContent);
      } catch (err) {
        console.log("Message content is not JSON, keeping as string.");
      }

      // Handle Bounce
      if (messageContent?.notificationType === "Bounce") {
        console.log("Processing Bounce notification...");
        messageContent.bounce.bouncedRecipients.forEach(async (recipient) => {
          console.log("Bounced email to save:", recipient.emailAddress);
          try {
            await BouncedEmail.create({
              email: recipient.emailAddress,
              type: "Bounce",
              reason: messageContent.bounce.bounceType
            });
            console.log("Saved bounced email:", recipient.emailAddress);
          } catch (err) {
            console.error("Error saving bounced email:", err);
          }
        });
      }

      // Handle Complaint
      if (messageContent?.notificationType === "Complaint") {
        console.log("Processing Complaint notification...");
        messageContent.complaint.complainedRecipients.forEach(async (recipient) => {
          console.log("Complaint email to save:", recipient.emailAddress);
          try {
            await BouncedEmail.create({
              email: recipient.emailAddress,
              type: "Complaint",
              reason: messageContent.complaint.complaintFeedbackType
            });
            console.log("Saved complaint email:", recipient.emailAddress);
          } catch (err) {
            console.error("Error saving complaint email:", err);
          }
        });
      }

      // For any other message type
      if (!messageContent?.notificationType) {
        console.log("Message content does not contain notificationType:", messageContent);
      }
    }

    console.log("=== End of SNS Processing ===");
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing SNS message:", err);
    res.status(500).send("Error");
  }
});

module.exports = router;
