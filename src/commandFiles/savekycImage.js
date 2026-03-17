import axios from 'axios';
import crypto from 'crypto';
import "../config/environment.js";
import fs from 'fs/promises';

function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'application/pdf': '.pdf'
  };
  
  return mimeToExt[mimeType] || '.bin';
}
const APP_TOKEN = process.env.SUMSUB_API_KEY;
const SECRET_KEY = process.env.SUMSUB_API_SECRET;
const URL_PATH = '/resources/inspections/687e1d37c86c05c9f0804cac/resources/75971305';

const body = {}; // Add request body if needed
const bodyJson = JSON.stringify(body);
const ts = Math.floor(Date.now() / 1000);

const stringToSign = `${ts}GET${URL_PATH}`;
console.log("String to Sign:", stringToSign);

const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(stringToSign)
    .digest("hex");

const headers = {
    "Content-Type": "application/json",
    "X-App-Token": APP_TOKEN,
    "X-App-Access-Sig": signature,
    "X-App-Access-Ts": ts,
};

 const response = await axios({
      method: 'GET',
      url:  `https://api.sumsub.com${URL_PATH}`,
      headers: headers,
      responseType: 'arraybuffer' // Important: Get binary data
    });

    // Get content type from response
    const contentType = response.headers['content-type'];
    console.log(`Content-Type: ${contentType}`);

    // Convert to Buffer
    const buffer = Buffer.from(response.data);
    console.log(`Downloaded ${buffer.length} bytes`);

    // Auto-generate filename if not provided
     
      const extension = getExtensionFromMimeType(contentType);
      const outputPath = `kycImage${extension}`;
   

    // Save to file
    await fs.writeFile(outputPath, buffer);
    console.log(`✓ Image saved successfully: ${outputPath}`);
