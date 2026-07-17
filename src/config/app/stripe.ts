/** @format */
import Env from "@/env.ts";
import Stripe from "stripe";

export default new Stripe(Env.STRIPE_SECRET_KEY);
