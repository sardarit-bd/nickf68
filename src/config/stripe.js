import dotenv from "dotenv";
import Stripe from 'stripe';

dotenv.config();

const mystripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default mystripe;