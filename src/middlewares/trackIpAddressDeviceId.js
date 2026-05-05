import axios from "axios";

import TrackIpAddressDeviceIdService from "../services/trackIpAddressDeviceId.service.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";

const trackIpAddressDeviceId = async (req, res, next) => {
  try {
    const deviceId = req?.headers?.["x-device-id"] || "api-developer-device-id-6666"; // Default Device ID for testing
    const deviceName = req?.headers?.["x-device-name"] || "api-developer-device-name-12310"; // Default Device Name for testing
    const deviceType = req?.headers?.["x-device-type"] || "Android"; // Default Device Type for testing
    req.headers['deviceid'] = deviceId;
    req.headers['deviceName'] = deviceName;  
    req.headers['deviceType'] = deviceType;
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    console.error("Error tracking IP address and device ID:", e.message);
  }
 
  next();
};

export default trackIpAddressDeviceId;
