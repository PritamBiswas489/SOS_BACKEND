console.log("This is the feezBackPayment.js file.");
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateKeyPath = path.join(
  __dirname,
  "../../public/freezBackKeys/privateprod.key",
);
//check file exists
if (!fs.existsSync(privateKeyPath)) {
  console.error("Private key file does not exist:", privateKeyPath);
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
console.log("Private key loaded successfully.");
console.log("Private Key Content:", privateKey);

const payload = {
    sub: '6666',
    iss: 'tpp/HEoRGloC4D',
    srv: 'fast/user',
    flow: {
        id: 'default',
        payment: {
            remittanceInformationUnstructured: 'R89001',
            creditor: {
                name: 'העברה בגין הזמנה R12345',
                account: 'IL820126560000000688807',
                accountType: 'iban'
            },
            transfer: {
                amount: {
                    value: '1.00',
                    editable: true
                },
                currency: {
                    value: 'ILS',
                    editable: true
                }
            }
        },
        userWasAuthenticated: false,
        context: 'R89001',
        redirects: {
            ttlExpired: 'https://btc-thai.com/offer/tests/feezback_webhook.php',
            pisSuccess: 'https://btc-thai.com/offer/tests/feezback_webhook.php',
            pisFailure: 'https://btc-thai.com/offer/tests/feezback_webhook.php',
            pisNotComplete: 'https://btc-thai.com/offer/tests/feezback_webhook.php'
        },
       
    }
    // Uncomment to enable mock: enableMock: true
};
const token = jwt.sign(payload, privateKey, { algorithm: "RS512" });

console.log("JWT Token generated successfully.", token);

const postData = {
  token: token,
};

try {
  const response = await axios.post(
    "https://lgs-prod.feezback.cloud/link",
    postData,
    {
      headers: {
        "Content-Type": "application/json",
      },
      maxRedirects: 10,
      timeout: 0,
    },
  );

  const result = response.data;
  const paymentLink = result.link;

  console.log("Payment link:", paymentLink);
  // Redirect user to paymentLink for payment
  console.log(paymentLink)
} catch (error) {
  console.log(error.message);
   
}
