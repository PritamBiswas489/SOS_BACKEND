import "../config/environment.js";
import db from "../databases/models/index.js";
const {Licenses} = db;

async function updateKycLicenseNumberFormat() {
   const getlicenses = await Licenses.findAll();
    for (const license of getlicenses) {
     console.log("Updating license ID:", license.license_key);
     const splitLicense = license.license_key.split("-");
     if (splitLicense.length === 3) {
       const newLicenseKey = `${splitLicense[0]}-${splitLicense[2]}`;
       await license.update({ license_key: newLicenseKey });
       console.log("Updated license key to:", newLicenseKey);
     } else {
       console.warn("Unexpected license key format for ID:", license.license_key);
     }
    }
}
updateKycLicenseNumberFormat();