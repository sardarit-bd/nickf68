import express from "express";
import checkoutSessionController from "../../controllers/paymentController/paymentController.js";

const router = express.Router();

// Create a new Stripe Checkout Session this route is called from the frontend when the user starts the payment process.It returns a session URL that the frontend redirects to.
router.post("/create-checkout-session", checkoutSessionController);

export default router;