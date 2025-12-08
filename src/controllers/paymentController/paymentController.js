import mystripe from "../../config/stripe.js";

const checkoutSessionController = async (req, res) => {

    const origin = req.headers.origin || "http://localhost:3000";

    try {

        const { price = 1000, currency = 'usd', quantity = 1, name = 'Demo product' } = req.body;

        const session = await mystripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: { name },
                        unit_amount: price,
                    },
                    quantity,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cancel`,
        });

        // Either return session.id or redirect client to session.url
        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }

}


export default checkoutSessionController;
