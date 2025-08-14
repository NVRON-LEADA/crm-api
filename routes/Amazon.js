const express = require('express');
const router = express.Router();

router.post('/ses/notifications', express.json({ type: '*/*' }), (req, res) => {
    const messageType = req.headers['x-amz-sns-message-type'];
    const message = req.body;

    console.log("Received SNS message:", messageType, message);

    // Step 1: Handle subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
        console.log("Subscription confirmation received");
        const https = require('https');
        https.get(message.SubscribeURL, (response) => {
            console.log('Subscription confirmed:', response.statusCode);
        });
    }

    // Step 2: Handle actual notifications from SES
    if (messageType === 'Notification') {
        const notification = JSON.parse(message.Message);
        console.log("SES Notification:", notification);

        // Example: Check if it's a bounce or complaint
        if (notification.notificationType === 'Bounce') {
            console.log("Bounce detected for:", notification.bounce.bouncedRecipients);
        } else if (notification.notificationType === 'Complaint') {
            console.log("Complaint detected for:", notification.complaint.complainedRecipients);
        } else {
            console.log("Delivery:", notification.delivery);
        }
    }

    res.sendStatus(200);
});

module.exports = router;
