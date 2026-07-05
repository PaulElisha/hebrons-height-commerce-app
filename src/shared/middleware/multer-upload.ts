/** @format */

import multer from "multer";

// const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10mb

const upload = multer({
 storage: multer.memoryStorage(),
});

export default upload;
