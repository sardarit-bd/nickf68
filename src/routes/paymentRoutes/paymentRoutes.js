import express from "express";
import checkoutSessionController from "../../controllers/paymentController/paymentController.js";
import stripewebhookController from "../../controllers/paymentController/stripewebhookController.js";
import verifythepaymentController from "../../controllers/paymentController/verifythepaymentController.js";


const router = express.Router();



router.post("/create-checkout-session", checkoutSessionController);
router.post("/verify-payment", verifythepaymentController);
router.post("/webhook", express.raw({ type: 'application/json' }), stripewebhookController);


export default router;