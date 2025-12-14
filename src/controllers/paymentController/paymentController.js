import mystripe from "../../config/stripe.js";
import CheckoutSession from "../../models/CheckoutSession.js";


//define PRICE_ID here
const PRICE_IDS = {
    usd: process.env.STRIPE_USD_PRICE_ID,
    eur: process.env.STRIPE_EUR_PRICE_ID,
    gbp: process.env.STRIPE_GBP_PRICE_ID,
};



const checkoutSessionController = async (req, res) => {

    const origin = req.headers.origin || process.env.CLIENT_URL;

    try {



        // destructure the body data here
        const { userId, email, currency = "usd" } = req.body;


        //validate the data here
        if (!email || !userId) {
            return res.status(400).json({ error: "userId and email is required" });
        }


        // CREATE IDEMPOTENCY KEY This ensures duplicate requests within a short time window don't create multiple sessions
        const idempotencyKey = `checkout_${userId}_${currency}_${Date.now()}`;



        // 1. Check if this user already has a Stripe Customer
        let customer = await mystripe.customers.list({
            email: email,
            limit: 1
        });


        // make customer object
        let iscustomer = customer.data[0];
        let stripeCustomerId;



        // check if user already used trial
        if (iscustomer) {
            const subs = await mystripe.subscriptions.list({
                customer: iscustomer.id,
                status: 'all',
                limit: 1,
            });

            const thisuserStatus = subs?.data?.[0]?.status;

            if (thisuserStatus == "active" || thisuserStatus == "trialing") {
                // customer already used trial before
                return res.json({
                    message: thisuserStatus == "active" ? "This user already has a subscription." : "User already used trial. No free trial available.",
                    allowTrial: false
                });
            }
        }



        // check if user already has a customer
        if (customer.data.length > 0) {
            stripeCustomerId = customer.data[0].id; // reuse
        } else {
            const newCustomer = await mystripe.customers.create({
                email,
                metadata: { userId }
            });
            stripeCustomerId = newCustomer.id;
        }




        // 2. Create subscription checkout session
        const session = await mystripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: stripeCustomerId,
            line_items: [
                {
                    price: PRICE_IDS[currency], // Subscription price ID
                    quantity: 1
                }
            ],


            // IMPORTANT: trial with card required
            subscription_data: {
                trial_period_days: 7,
            },

            // Payment collection to ensure card is required before trial
            payment_method_collection: "always",




            // user can enter promo code
            allow_promotion_codes: true,

            // optional: pre-applied discount
            // discounts: [{ coupon: "coupon_xxx" }],



            success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/premium/cancel`,
            metadata: {
                userId,
                currency
            }
        }, {
            idempotencyKey: idempotencyKey
        });



        //store data in database here
        await CheckoutSession.create({
            sessionId: session.id,
            currency,
            userId,
            quantity: 1,
            rawResponse: session
        });



        // Either return session.id or redirect client to session.url
        res.json({ id: session.id, url: session.url });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }

}


export default checkoutSessionController;
