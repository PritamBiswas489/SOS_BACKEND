import "../config/environment.js";
import axios from "axios";
import twilio from "twilio";

/**
 * Service to send OTP via WhatsApp using Respond.io API
 * @param {string} number - The phone number to send the OTP to
 * @param {string} otp_code - The OTP code to send
 * @return {Promise<Object>} - The response from the API
 * @throws {Error} - If the API request fails
 */
export const otpWhatsappService = async (number, otp_code) => {
        const AUTH_TOKEN =
            "Bearer "+process.env.RESPOND_IO_API_KEY ;
        const headers = {
            Accept: "application/json",
            Authorization: AUTH_TOKEN,
        };
        try {
            // Step 1: Check if number exists
            const getUrl = `https://api.respond.io/v2/contact/phone:+${number}`;
            let response = await axios.get(getUrl, { headers });
            console.log(`Number exists: ${number}`);
        } catch (err) {
            console.log(`Creating number: ${number}`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // Step 2: Create number if not found
            const createUrl = `https://api.respond.io/v2/contact/create_or_update/phone:+${number}`;
            const createPayload = {
            firstName: "Customer",
            phone: number,
            };
            await axios.post(createUrl, createPayload, {
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            });
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        // Step 3: Send OTP message
        const messagePayload = {
            channelId: 93780,
            message: {
            type: "whatsapp_template",
            template: {
                name: "whatsapp_authenticator",
                languageCode: "he",
                components: [
                {
                    type: "body",
                    text: `${otp_code} is your verification code.`,
                    parameters: [{ type: "text", text: otp_code }],
                },
                {
                    type: "buttons",
                    buttons: [
                    {
                        type: "url",
                        text: "Copy Code",
                        url: `https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp${otp_code}`,
                        parameters: [{ type: "text", text: otp_code }],
                    },
                    ],
                },
                ],
            },
            },
        };

        const messageUrl = `https://api.respond.io/v2/contact/phone:+${number}/message`;

        try {
            const messageResponse = await axios.post(messageUrl, messagePayload, {
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            });

            return messageResponse.data
        } catch (error) {
            const errorData = error.response?.data || {};
            const contactId = errorData.message?.contactId;

            if (contactId) {
                const fallbackUrl = `https://api.respond.io/v2/contact/id:${contactId}/message`;
                const retryResponse = await axios.post(fallbackUrl, messagePayload, {
                    headers: {
                    ...headers,
                    "Content-Type": "application/json",
                    },
                });


                return retryResponse.data
            } else {
            console.error(errorData);
                return {error: "Failed to send message", details: errorData}
            }
        }
};
/**
 * 
 * @param {*} number 
 * @param {*} otp_code 
 * @returns  {Promise<Object>} - The response from the Twilio API
 * @throws {Error} - If the Twilio API request fails
 * @description This function sends an OTP code via SMS using Twilio's messaging service.
 */
export const otpSmsService = async (number, otp_code, appHash) => {
     try {
         const accountSid = process.env.TWILLO_ACCOUNT_SID;
        const authToken = process.env.TWILLO_AUTH_TOKEN;
        console.log("Twilio Account SID:", accountSid);
        console.log("Twilio Auth Token:", authToken);
        const client = twilio(accountSid, authToken);

       const response = await client.messages
        .create({
            body: `<#> שלום! הקוד שלך לכניסה לאפליקציית TRAVEL MONEY הוא: ${otp_code}. הקוד בתוקף ל-10 דקות. שמרו עליו בסוד 🤫\n${appHash}`,
            from: 'TravelMoney',
            to: number
        })

        if(response?.sid){
            return {msg: "SMS sent successfully", sid: response.sid};
        }else{
            console.error("Failed to send SMS:", response);
            return {error: "Failed to send SMS", details: response};
        }

     } catch (error) {
         console.error("Error in SMS service:", error);
         return {error: "Sms Sending failed "+error.message, details: error};
     }

};
