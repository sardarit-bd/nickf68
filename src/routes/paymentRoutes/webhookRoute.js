import express from "express";
import stripewebhookController from "../../controllers/paymentController/stripewebhookController.js";


const router = express.Router();


// Stripe Webhook Endpoint Stripe sends events (like successful payments, refunds, failures, etc.) to this URL. The controller handles different webhook event types.
router.post("/webhook", express.raw({ type: 'application/json' }), stripewebhookController);


export default router;