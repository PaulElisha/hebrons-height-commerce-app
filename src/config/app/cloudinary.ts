/** @format */
import { v2 as cloudinary } from "cloudinary";

import Env from "@/env.ts";
cloudinary.config({
 cloud_name: Env.CLOUDINARY_CLOUD_NAME,
 api_key: Env.CLOUDINARY_KEY,
 api_secret: Env.CLOUDINARY_SECRET,
});

export default cloudinary;
