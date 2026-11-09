/** @format */
import Env from "@/env.ts";
import { Bachs } from "@bachs/sdk";

export default new Bachs({
 apiKey: Env.BACHS_SECRET_KEY,
});
