// import { S3Client } from "@aws-sdk/client-s3";
// import multer from "multer";
// import multerS3 from "multer-s3";
// import "dotenv/config";

// const s3 = new S3Client({
//   region: process.env.REGION!,
//   credentials: {
//     accessKeyId: process.env.AWS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET!,
//   },
// });

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.BUCKET_NAME!,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     acl: "public-read",
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       cb(null, `uploads/${Date.now()}_${file.originalname}`);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed!"));
//     }
//   },
// });

// export default upload;
