import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga .env de la carpeta actual y de la raíz TRUSTPHONE_BACKEND
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
    db:{
        URI: process.env.DB_URI
    },
    JWT:{
        secret: process.env.JWT_Secret_key
    },
    email:{
        user_email: process.env.USER_EMAIL,
        user_password: process.env.USER_PASSWORD
    }   ,
    mailjet:{
        apiKey: process.env.API_KEY_MAILJET,
        secretKey: process.env.API_SECRET_MAILJET,
        fromEmail: process.env.MAILJET_FROM_EMAIL,
        fromName: process.env.MAILJET_FROM_NAME
    },
    cloudinary:{
        cloudinary_name:  process.env.CLOUDINARY_CLOUD_NAME,
        cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
        cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET
    }
}