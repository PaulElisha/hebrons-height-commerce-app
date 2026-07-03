/** @format */

import Env from "@/env.ts";
import cors from "cors";

export default cors({
 origin: ["https://6a285a07cdd9d108e8caabd4.base44.app", Env.CORS_ORIGIN],
 methods: ["GET", "POST", "PUT", "DELETE"],
 credentials: true,
});
