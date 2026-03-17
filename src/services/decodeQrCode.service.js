import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import {Jimp} from 'jimp';
import jsQR from 'jsqr';

export default class DecodeQrCodeService {
  static async decodeQR(imagePath) {
     // Read the image file
    const image = await Jimp.read(imagePath);
    
    // Get image data in RGBA format
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height
    };
    
    // Decode the QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code?.data ? code.data : null;
  }
}
