import mystripe from "../../config/stripe.js";
import CheckoutSession from "../../models/CheckoutSession.js";
import ProcessedWebhookEvent from "../../models/ProcessedWebhookEvent.js";
import isPremiumStatus from "../../utils/isPremiumStatus.js";
import toDate from "../../utils/toDate.js";


const stripewebhookController = async (req, res) => {

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;


    try {


        //webhook event here
        const event = mystripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            webhookSecret
        );




        // CHECK: Has this event.id been processed before?
        const alreadyProcessed = await ProcessedWebhookEvent.findOne({
            eventId: event.id
        });

        if (alreadyProcessed) {
            console.log(`Ignoring duplicate event: ${event.id}`);
            return res.json({ received: true, processed: true }); // Don't process twice!
        }

        // MARK as processed BEFORE doing anything
        await ProcessedWebhookEvent.create({
            eventId: event.id,
            eventType: event.type
        });





        // ---------------------------
        // ONE-TIME PAYMENT COMPLETED
        // ---------------------------
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;


            let subscriptionData = null;
            if (session.subscription) {
                subscriptionData = await mystripe.subscriptions.retrieve(session.subscription);
            }



            await CheckoutSession.findOneAndUpdate(
                { sessionId: session.id },
                {
                    userId: session.metadata?.userId,
                    status: subscriptionData?.status || "incomplete",
                    customerId: session.customer,
                    isPremium: isPremiumStatus(subscriptionData?.status),
                    subscriptionId: session.subscription || null,
                    paymentIntentId: session.payment_intent,
                    customerEmail: session.customer_details?.email,
                    paymentMethod: session.payment_method_types?.[0],
                    currency: session.currency,
                    priceId: subscriptionData?.items?.data?.[0]?.price?.id || null,
                    trialStart: toDate(subscriptionData?.trial_start),
                    trialEnd: toDate(subscriptionData?.trial_end),
                    currentPeriodStart: toDate(subscriptionData?.items?.data?.[0]?.current_period_start),
                    currentPeriodEnd: toDate(subscriptionData?.items?.data?.[0]?.current_period_end),

                },
                { new: true }
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
                    status: subscription.status,
                    priceId: subscription.items.data[0].price.id,
                    customerId: subscription.customer,
                    trialStart: toDate(subscription.trial_start),
                    trialEnd: toDate(subscription.trial_end),
                    currentPeriodStart: toDate(subscription.items.data[0].current_period_start),
                    currentPeriodEnd: toDate(subscription.items.data[0].current_period_end),
                    isPremium: isPremiumStatus(subscription.status),
                },
                { new: true }

            );
        }



        // ---------------------------
        // In customer.subscription.updated (add this event)
        // ---------------------------
        if (event.type === "customer.subscription.updated") {
            const subscription = event.data.object;


            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: subscription.id },
                {
                    status: subscription.status,
                    isPremium: isPremiumStatus(subscription.status),
                    customerId: subscription.customer,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                    canceledAt: toDate(subscription.canceled_at),
                    currentPeriodStart: toDate(subscription.items.data[0].current_period_start),
                    currentPeriodEnd: toDate(subscription.items.data[0].current_period_end),
                },
                { new: true }
            );
        }




        // ---------------------------
        // SUBSCRIPTION RENEWED / PAID
        // ---------------------------
        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object;


            if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create") {


                const subID = invoice?.parent?.subscription_details?.subscription;


                // Fetch the actual subscription to check its status
                const subscription = await mystripe.subscriptions.retrieve(subID);


                // Check if this is a $0 trial invoice
                const isTrialInvoice = invoice.amount_paid === 0 && subscription.status === "trialing";


                if (isTrialInvoice) {

                    await CheckoutSession.findOneAndUpdate(
                        { subscriptionId: subID },
                        {
                            status: subscription?.status, // Use actual subscription status
                            isPremium: isPremiumStatus(subscription.status),
                            lastInvoiceId: invoice.id,
                            lastInvoiceStatus: "paid",  // ✅ Invoice status can be "paid"
                        },
                        { new: true }
                    );


                } else {


                    await CheckoutSession.findOneAndUpdate(
                        { subscriptionId: subID },
                        {
                            status: subscription?.status, // Use actual subscription status
                            isPremium: isPremiumStatus(subscription.status),
                            lastInvoiceId: invoice.id,
                            lastInvoiceStatus: "paid",  // ✅ Invoice status can be "paid"
                            lastPaymentAt: new Date(),
                            currentPeriodStart: toDate(invoice.period_start),
                            currentPeriodEnd: toDate(invoice.period_end),
                        },
                        { new: true }
                    );


                }

            }
        }

        // ---------------------------
        // SUBSCRIPTION CANCELLED
        // ---------------------------
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;


            await CheckoutSession.findOneAndUpdate(
                { subscriptionId: subscription.id },
                {
                    status: "canceled",
                    isPremium: false,
                    canceledAt: toDate(subscription.canceled_at),
                },
                { new: true }
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
                    status: "past_due",
                    lastInvoiceId: invoice.id,
                    lastInvoiceStatus: "failed",
                    isPremium: false
                },
                { new: true }
            );
        }

        res.json({ received: true });

    } catch (err) {
        console.log(`⚠️ Webhook Error:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

export default stripewebhookController;
