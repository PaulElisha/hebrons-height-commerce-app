/** @format */
import multer from "multer";

const FIVE_MB = 5 * 1024 * 1024;

const upload = multer({
 storage: multer.memoryStorage(),
 limits: {
  fileSize: FIVE_MB,
 },
});

export default upload;
