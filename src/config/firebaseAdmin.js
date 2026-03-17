import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import "../config/environment.js";

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the path to the service account key
// Use production key if available, fallback to development
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  : join(__dirname, '../../firebase/testingfcm123-f729f-firebase-adminsdk-fbsvc-68015db106.json');
// console.log(serviceAccountPath)

// Read and parse the key
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath), 'utf8');

// console.log(serviceAccount)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
