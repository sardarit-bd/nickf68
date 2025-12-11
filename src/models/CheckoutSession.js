import mongoose from "mongoose";

const CheckoutSessionSchema = new mongoose.Schema(
    {
        // Checkout Session ID from Stripe
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },

        // Local user ID (your user)
        userId: {
            type: String,
            required: true
        },

        // Stripe Customer
        customerId: {
            type: String, // cus_xxx
        },

        // Stripe Subscription
        subscriptionId: {
            type: String, // sub_xxx
        },

        // Monthly plan price id
        priceId: {
            type: String, // price_xxx
        },

        // Currency
        currency: {
            type: String,
            required: true,
        },

        quantity: {
            type: Number,
            default: 1,
        },

        // ==========================
        //   SUBSCRIPTION STATUS
        // ==========================
        status: {
            type: String,
            enum: [
                "pending",        // checkout created
                "trialing",       // 7-day trial
                "active",         // subscription running
                "past_due",       // payment failed
                "canceled",       // user canceled
                "unpaid"          // Stripe failed to collect payment
            ],
            default: "pending",
        },

        // ==========================
        //   SUBSCRIPTION PERIODS
        // ==========================
        trialStart: Number,
        trialEnd: Number,

        currentPeriodStart: Number,
        currentPeriodEnd: Number,

        cancelAtPeriodEnd: Boolean,
        canceledAt: Number,

        // ==========================
        //   PAYMENT INFO
        // ==========================
        customerEmail: String,

        paymentIntentId: String,
        paymentMethod: String,

        lastInvoiceId: String,
        lastInvoiceStatus: String,

        isPremium: {
            type: Boolean,
            default: false
        },

        // last successful payment time
        lastPaymentAt: {
            type: Date,
        },

        // Store full Stripe event for debugging
        rawResponse: Object,
    },
    { timestamps: true }
);

const CheckoutSession = mongoose.model(
    "CheckoutSession",
    CheckoutSessionSchema
);

export default CheckoutSession;
