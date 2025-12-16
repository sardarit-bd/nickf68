import express from "express";
import customerPortalController from "../../controllers/paymentController/customerPortalController.js";
import checkoutSessionController from "../../controllers/paymentController/paymentController.js";
import subscriptionController from "../../controllers/paymentController/subscriptionController.js";

const router = express.Router();

// Create a new Stripe Checkout Session this route is called from the frontend when the user starts the payment process.It returns a session URL that the frontend redirects to.
router.post("/create-checkout-session", checkoutSessionController);


//portal route defind here
router.post("/portal", customerPortalController);


//subscription route defind here
router.post("/subscription", subscriptionController);


export default router;