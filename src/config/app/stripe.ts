/** @format */

import Stripe from "stripe";
import Env from "../../../env.ts";

export default new Stripe(Env.STRIPE_SECRET_KEY);
