import CheckoutSession from "../../models/CheckoutSession.js";

const subscriptionController = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const userRecord = await CheckoutSession.findOne({ userId });

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" });
        }

        const responseData = {
            sessionId: userRecord.sessionId,
            customerId: userRecord.customerId,
            subscriptionId: userRecord.subscriptionId,
            priceId: userRecord.priceId,
            currency: userRecord.currency,
            status: userRecord.status,
            cancelAtPeriodEnd: userRecord.cancelAtPeriodEnd,
            canceledAt: userRecord.canceledAt,
            currentPeriodStart: userRecord.currentPeriodStart,
            currentPeriodEnd: userRecord.currentPeriodEnd,
            trialStart: userRecord.trialStart,
            trialEnd: userRecord.trialEnd,
            isPremium: userRecord.isPremium,
            lastPaymentAt: userRecord.lastPaymentAt,
            lastInvoiceId: userRecord.lastInvoiceId,
            lastInvoiceStatus: userRecord.lastInvoiceStatus,
            createdAt: userRecord.createdAt,
            updatedAt: userRecord.updatedAt
        }

        res.json({
            success: true,
            data: responseData, // now safe
            message: "Subscription data fetched successfully"
        });
    } catch (err) {
        console.error("Subscription error:", err);
        res.status(500).json({ error: err.message });
    }
};

export default subscriptionController;
