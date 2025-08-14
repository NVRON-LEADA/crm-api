const express = require('express');
const router = express.Router();
const fetch = global.fetch; // Node 18+

router.post("/ses/notifications", async (req, res) => {
  try {
    const messageType = req.header("x-amz-sns-message-type");

    // Parse body manually if it's string
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        // keep as string
      }
    }

    if (messageType === "SubscriptionConfirmation") {
      const { SubscribeURL } = body;
      if (SubscribeURL) {
        console.log("Confirming subscription with:", SubscribeURL);
        await fetch(SubscribeURL);
        return res.status(200).send("Subscription confirmed");
      }
    }

    if (messageType === "Notification") {
      let messageContent = body.Message;
      try {
        messageContent = JSON.parse(body.Message);
      } catch (err) {
        // Not JSON, keep as string
      }

      console.log("Received SNS Notification:", messageContent);

      if (messageContent?.notificationType === "Bounce") {
        messageContent.bounce.bouncedRecipients.forEach(recipient => {
          console.log("Bounced email:", recipient.emailAddress);
        });
      }

      if (messageContent?.notificationType === "Complaint") {
        messageContent.complaint.complainedRecipients.forEach(recipient => {
          console.log("Complaint email:", recipient.emailAddress);
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
