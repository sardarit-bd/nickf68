import mystripe from "../../config/stripe.js";



const customerPortalController = async (req, res) => {
    try {
        const { customerId } = req.body; // or get from session

        if (!customerId) {
            return res.status(400).json({ error: "customerId is required" });
        }

        const session = await mystripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.origin || process.env.CLIENT_URL}/account`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("Portal error:", err);
        res.status(500).json({ error: err.message });
    }
};

export default customerPortalController;