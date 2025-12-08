import mystripe from "../../config/stripe.js";

const stripewebhookController = async (req, res) => {


    try {

        const event = mystripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            webhookSecret
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // THIS IS THE SOURCE OF TRUTH
            // Fulfill order here - this ALWAYS happens
            await fulfillOrder(session);
            console.log('✅ Order fulfilled via webhook');
        }

        res.json({ received: true });


    } catch (error) {
        console.log(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }





}

export default stripewebhookController;