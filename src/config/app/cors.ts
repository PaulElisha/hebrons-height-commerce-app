/** @format */

import Env from "@/env.ts";
import cors from "cors";

export default cors({
 origin: Env.CORS_ORIGIN,
 methods: ["GET", "POST", "PUT", "DELETE"],
 credentials: true,
});
