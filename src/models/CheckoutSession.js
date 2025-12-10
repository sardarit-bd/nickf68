import mongoose from "mongoose";

const CheckoutSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            required: true,
        },

        productName: {
            type: String,
            required: true,
        },

        quantity: {
            type: Number,
            default: 1,
        },

        // IMPORTANT: new status values for subscription handling
        status: {
            type: String,
            enum: [
                "pending",
                "paid",
                "active",         // <-- subscription running
                "canceled",       // <-- subscription cancelled
                "payment_failed"  // <-- renewal failed
            ],
            default: "pending",
        },

        customerEmail: {
            type: String,
        },

        paymentIntentId: {
            type: String,
        },

        paymentMethod: {
            type: String,
        },

        // NEW FIELD: Subscription ID
        subscriptionId: {
            type: String,
        },

        // NEW FIELD: last successful renewal
        lastPaymentAt: {
            type: Date,
        },

        rawResponse: {
            type: Object,
        },
    },
    { timestamps: true }
);

const CheckoutSession = mongoose.model(
    "CheckoutSession",
    CheckoutSessionSchema
);

export default CheckoutSession;
