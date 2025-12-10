import mystripe from "../../config/stripe.js";
import CheckoutSession from "../../models/CheckoutSession.js";
import toCents from "../../utils/toCents.js";

const checkoutSessionController = async (req, res) => {

    const origin = req.headers.origin || "http://localhost:4242";

    try {



        // destructure the body data here
        const { userId, email, currency = "usd", } = req.body;


        //validate the data here
        if (!email || !userId) {
            return res.status(400).json({ error: "userId and email is required" });
        }



        //define prices currency here
        const products = [
            { name: "CoreTrak Premium", currency: "usd", price: "12.99" },
            { name: "CoreTrak Premium", currency: "eur", price: "10.99" },
            { name: "CoreTrak Premium", currency: "gbp", price: "9.99" },
        ];


        // currency matching here
        const currencyMatching = products?.filter((item) => {
            return item.currency === currency;
        });



        //create checkout session here
        const session = await mystripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currencyMatching[0].currency,        // now you define currency here
                        unit_amount: toCents(currencyMatching[0].price),      // amount in cents
                        product_data: { name: currencyMatching[0].name },
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cancel`,
        });



        //store data in database here
        await CheckoutSession.create({
            sessionId: session.id,
            amount: toCents(currencyMatching[0].price),
            currency: currencyMatching[0].currency,
            productName: currencyMatching[0].name,
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
