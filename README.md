## CoreTrak Stripe Integration

A clean, subscription-only Stripe billing integration for CoreTrak PWA with free trial support, Apple Pay, Google Pay, and webhook-driven subscription management.

## Overview

This integration handles all payment and subscription logic for CoreTrak's Premium tier using Stripe Checkout. The system is designed to be simple, reliable, and easily extensible for future pricing tiers.

## Features

-  Stripe Checkout session creation
-  7-day free trial with auto-renewal
-  Multi-currency support (GBP, EUR, USD)
-  Apple Pay & Google Pay integration
-  Webhook-driven subscription lifecycle management
-  Customer billing portal access
-  Robust error handling and logging
-  Idempotent webhook processing

# Pricing Model

### Current Implementation (MVP)

**Premium Tier**
- **Price:** £9.99 GBP / €10.99 EUR / $11.99 USD
- **Billing:** Monthly subscription
- **Trial:** 7 days free
- **Payment Methods:** Card, Apple Pay, Google Pay

### Future Tiers (Not Implemented)
- Basic Tier: £6.99/month
- Pro Tier: £20-25/month

---

## API Endpoints

### 1. Create Checkout Session

Creates a Stripe Checkout session for subscription signup.

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Request Body:**
```json
{
  "userId": "abc123",
  "email": "user@example.com",
   "currency" :"eur"   //usd,eur,gbp, (default)	
}
```

**Response:**
```json
{
    "id": "cs_test_b1KmYfYgo6vqztQVf9lSWStvn3eS1fYMufEYbF5iwIFY4mSSeR2I11K1pW",
    "url": "https://checkout.stripe.com/c/pay/cs_test_b1KmYfYgo6vqztQVf9lSWStvn3eS1fYMufEYbF5iwIFY4mSSeR2I11K1pW#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VklCQ31OVE1JfW8ycVZ1N1czb0tqMUpKbFNAN0hSXExrQUdNPTZNbG1jVF1JYFdOPTQ2N0FidD1dZl9HRD1dal9HN2NQN0ZuV2tsfXRPV2dxblRScUhmNTVwUVNUbz1uYycpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl"
}
```

**Checkout URLs:**
- Success: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
- Cancel: `${origin}/premium/cancel`,


---

### 2. Stripe Webhooks

Handles all Stripe subscription lifecycle events.

**Endpoint:** `POST /api/stripe/webhook`

**Supported Events:**
- `customer.subscription.created` - New subscription started
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled
- `checkout.session.completed` - Payment succeeded
- `invoice.payment_failed` - Payment failed
- `customer.subscription.trial_will_end` - Trial ending soon (optional)

**Webhook Behaviours:**
- Updates user subscription status in database
- Stores Stripe customer ID and subscription ID
- Updates `isPremium` flag based on status
- Handles payment failures by marking account inactive
- Idempotent processing to prevent duplicate updates

---

### 3. Customer Portal

Returns a link to Stripe's customer billing portal.

**Endpoint:** `POST /api/stripe/portal`


**Request:**
```json
{
    "customerId":"cus_TbPysZJ2164NW3"
}
```


**Response:**
```json
{
    "url": "https://billing.stripe.com/p/session/test_YWNjdF8xU0xHRnhLUUhMeGo3dFNwLF9UY1F6Q3ltbkF0Q0t3UzE4QmNxTGtERmFtZjFPOFRG0100tRBpipIT"
}
```

**Portal Features:**
- Update payment method
- View invoices
- Cancel subscription


---

## Database Schema

The integration updates the following fields in the user table:

```javascript
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
```

### Subscription Status Mapping

| Stripe Status | `subscriptionStatus` | `isPremium` |
|---------------|---------------------|-------------|
| `active`      | `active`            | `true`      |
| `trialing`    | `trialing`          | `true`      |
| `past_due`    | `past_due`          | `false`     |
| `canceled`    | `canceled`          | `false`     |

---

## User Flow

1. User clicks "Upgrade to Premium" in app
2. Frontend calls `POST /api/stripe/create-checkout-session`
3. User is redirected to Stripe Checkout
4. User completes payment or starts free trial
5. Stripe redirects to success/cancel URL
6. Webhook fires and updates database
7. Premium features are unlocked

---

## Stripe Product Configuration

### Product Details
- **Name:** CoreTrak Premium
- **Type:** Recurring subscription
- **Billing Interval:** Monthly
- **Trial Period:** 7 days
- **Currencies:** GBP (primary), EUR, USD

### Price IDs
Document your Stripe Price IDs here after creation:

```
GBP: price_xxxxxxxxxxxxx
EUR: price_xxxxxxxxxxxxx
USD: price_xxxxxxxxxxxxx
```

---

## Apple Pay & Google Pay Setup

### Domain Verification

1. Upload the Apple domain verification file to:
   ```
   https://coretrak.fit/.well-known/apple-developer-merchantid-domain-association
   ```

2. Verify domain in Stripe Dashboard:
   - Settings → Payment methods → Apple Pay
   - Add domain: `coretrak.fit`

### Stripe Checkout Configuration

Apple Pay and Google Pay are automatically enabled in Stripe Checkout when:
- ✅ Domain is verified
- ✅ Payment methods are enabled in Stripe settings
- ✅ User's browser/device supports the payment method

No additional frontend code required.

---

## Security Features

### Webhook Signature Verification
All webhooks verify Stripe signatures using the official Stripe library:
```javascript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```

### Idempotency
- Webhook events are processed idempotently using event IDs
- Prevents duplicate subscription updates
- Safe retry handling for failed webhook processing

### Error Handling
- All Stripe API calls wrapped in try-catch blocks
- Failed webhooks are logged with full context
- Subscription status transitions are logged
- Payment failures trigger user notifications

---

## Environment Variables

```bash
# Application Port 
PORT = 4242

#frontend application url
CLIENT_URL=http://localhost:3000

# Databse config here
MONGO_URI='your mongodb database connection url/stripe_intregation'

# Environment Here
NODE_ENV=development


#jwt secrect
JWT_SECRET="your jwt secret key"


#stripe paymentigation
STRIPE_SECRET_KEY= "your screct key"
STRIPE_WEBHOOK_SECRET= "your webhook sceret key"


#price id defind here
STRIPE_USD_PRICE_ID= "your price id for usd"
STRIPE_EUR_PRICE_ID= "your price id for eur"
STRIPE_GBP_PRICE_ID= "your price id for gbp"
```

---

## Testing Checklist

### Test Scenarios

- [ ] **Free Trial Start**
  - Create checkout session
  - Complete trial signup
  - Verify `trialing` status in DB
  - Verify `isPremium = true`

- [ ] **Trial to Active Conversion**
  - Wait for trial end (or use Stripe test clock)
  - Verify subscription becomes `active`
  - Verify charge succeeded

- [ ] **Payment Renewal**
  - Fast-forward to next billing date
  - Verify renewal charge
  - Verify `subscriptionCurrentPeriodEnd` updated

- [ ] **Payment Failure**
  - Use test card that triggers decline
  - Verify `past_due` status
  - Verify `isPremium = false`

- [ ] **Cancellation**
  - Cancel via customer portal
  - Verify `canceled` status
  - Verify access removed at period end

- [ ] **Apple Pay**
  - Test on Safari/iOS device
  - Complete payment
  - Verify webhook received

- [ ] **Google Pay**
  - Test on Chrome with saved cards
  - Complete payment
  - Verify webhook received

- [ ] **Customer Portal**
  - Generate portal link
  - Update payment method
  - View invoices
  - Cancel subscription

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Authentication Required: 4000 0025 0000 3155
```


---

## Deployment Instructions

### 1. Configure Stripe Dashboard

1. Create Product: "CoreTrak Premium"
2. Add Prices for GBP, EUR, USD
3. Enable Apple Pay domain verification
4. Configure webhook endpoint: `https://coretrak.fit/api/stripe/webhooks`
5. Select webhook events (see supported events above)
6. Copy webhook signing secret

### 2. Deploy Backend

1. Set environment variables
2. Deploy API endpoints
3. Test webhook endpoint is accessible
4. Verify webhook signature validation

### 3. Test in Production

1. Create test subscription
2. Monitor webhook logs
3. Verify database updates
4. Test customer portal
5. Test Apple/Google Pay

### 4. Go Live

1. Switch to live Stripe keys
2. Update webhook endpoint to live mode
3. Re-verify Apple Pay domain
4. Monitor first real transactions

---

## Support & Troubleshooting

### Common Issues

**Webhook not firing**
- Check webhook URL is publicly accessible
- Verify webhook signing secret is correct
- Check Stripe dashboard for webhook delivery attempts

**Payment failed**
- Check Stripe dashboard for decline reason
- Verify test card numbers
- Check customer has sufficient funds (production)

**Apple Pay not showing**
- Verify domain verification file is accessible
- Check domain is added in Stripe dashboard
- Ensure user is on Safari/iOS

**Duplicate subscriptions**
- Check idempotency implementation
- Verify webhook event IDs are being tracked
- Review webhook retry logic

---

## File Structure

```
/src
    /config
        db.js
        env.js
        stripe.js
    /controllers
        customerPortalController.js   
        paymentController.js                   
        subscriptionController.js
        stripewebhookController.js                      
    /middlewares
    /models
        CheckoutSession.js                    
       ProcessedWebhookEvent.js              
    /Routes
        paymentRoutes.js                    
        webhookRoute.js  
    /utils
        isPremiumStatus.js                       
        toCents.js   
        toDate.js                       

.env.development
.env.production   
```

---

## Notes

- This is a **backend-only** integration
- No UI components included
- No OAuth implementation
- No mobile app store billing (web only)
- System designed for easy extension to additional tiers
- All complexity handled by Stripe Checkout

---

## Contact

For questions or issues with this integration, contact the development team.

**Last Updated:** December 2025