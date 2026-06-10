import "../config/environment.js";
import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
async function getIceServers() {
  const token = await client.tokens.create();
  return token.iceServers; // Pass this to your WebRTC client
}
console.log(await getIceServers());

