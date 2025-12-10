import mystripe from "../../config/stripe.js";
import CheckoutSession from "../../models/CheckoutSession.js";

const stripewebhookController = async (req, res) => {

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;


    try {

        const event = mystripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            webhookSecret
        );


        // ---------------------------
        // ONE-TIME PAYMENT COMPLETED
        // ---------------------------
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            await CheckoutSession.findOneAndUpdate(
                { sessionId: session.id },
                {
                    status: "paid",
                    paymentIntentId: session.payment_intent,
                    customerEmail: session.customer_details?.email,
                    paymentMethod: session.payment_method_types?.[0],
                    subscriptionId: session.subscription || null
                }
            );
        }

        // ---------------------------
        // SUBSCRIPTION CREATED
        // ---------------------------
        if (event.type === "customer.subscription.created") {
            const subscription = event.data.object;

            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: subscription.id },
                {
                    status: "active"
                }
            );
        }

        // ---------------------------
        // SUBSCRIPTION RENEWED / PAID
        // ---------------------------
        if (event.type === "invoice.paid") {
            const invoice = event.data.object;

            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: invoice.subscription },
                {
                    status: "active",
                    lastPaymentAt: new Date()
                }
            );
        }

        // ---------------------------
        // SUBSCRIPTION CANCELLED
        // ---------------------------
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;

            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: subscription.id },
                {
                    status: "canceled"
                }
            );
        }

        // ---------------------------
        // PAYMENT FAILED (renewal failed)
        // ---------------------------
        if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object;

            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: invoice.subscription },
                {
                    status: "payment_failed"
                }
            );
        }

        res.json({ received: true });

    } catch (err) {
        console.log(`⚠️ Webhook Error:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

export default stripewebhookController;
