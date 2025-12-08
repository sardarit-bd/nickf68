import mystripe from "../../config/stripe.js";

const verifythepaymentController = async (req, res) => {


    const { sessionId } = req.body;

    try {
        const session = await mystripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Payment confirmed!
            res.json({ success: true, session });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }


};


export default verifythepaymentController;