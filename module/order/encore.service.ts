/** @format */

import { Service } from "encore.dev/service";
import { rateLimit } from "../../shared/rate-limit";

export default new Service("order", { middlewares: [rateLimit] });
