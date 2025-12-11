import mystripe from "../../config/stripe.js";
import CheckoutSession from "../../models/CheckoutSession.js";


//define PRICE_ID here
const PRICE_IDS = {
    usd: "price_1Sd1KOKQHLxj7tSpz1tFBihh",
    eur: "price_1Sd1MPKQHLxj7tSpEqlLMwAz",
    gbp: "price_1Sd1MrKQHLxj7tSp9OU003t4",
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



        // 1. Check if this user already has a Stripe Customer
        let customer = await mystripe.customers.list({
            email: email,
            limit: 1
        });



        let stripeCustomerId;


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


            success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/premium/cancel`,
            metadata: {
                userId,
                currency
            }
        });



        //store data in database here
        await CheckoutSession.create({
            sessionId: session.id,
            currency,
            userId,
            quantity: 1,
            status: "pending",
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
