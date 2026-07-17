/** @format */
import cors from "cors";

import Env from "@/env.ts";
const allowedOrigins = Env.CORS_ORIGIN.includes(",")
 ? Env.CORS_ORIGIN.split(",")
 : [Env.CORS_ORIGIN];

export default cors({
 origin: allowedOrigins,
 methods: ["GET", "POST", "PUT", "DELETE"],
 credentials: true,
});
