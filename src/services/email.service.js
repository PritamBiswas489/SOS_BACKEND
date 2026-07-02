import nodemailer from 'nodemailer';
import "../config/environment.js";
import fs from 'fs';
import path from 'path';
import UserService from './user.service.js';
import KycService from './kyc.service.js';
 

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // e.g. smtp.gmail.com | smtp.sendgrid.net
  port: 587,
  secure: false,                // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,   // your email address
    pass: process.env.SMTP_PASSWORD,   // app password or SMTP key
  },
});

// ── Send Email ───────────────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html }) {
  let from  = process.env.SMTP_FROM;
  if(from === to){
    from = process.env.SMTP_FROM2;
  }
  console.log(`Sending email to: ${to}, from: ${from}, subject: ${subject}`);
  const info = await transporter.sendMail({
    from: `KobyTech ${from}`, // sender address
    to,
    subject,
    html,
  });
 
  console.log("✅ Email sent:", info.messageId);
  return info;
}


export async function testEmail() {
  const to = "pritam.biswas489@gmail.com";
  const subject = "Test Email from SOS App";

  const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-email-template.html");
  const html = fs.readFileSync(filePath, "utf-8");

  return sendEmail({ to, subject, html });
}

export async function NGO_Registration_Received(ngoId){
  try{
    const subject = "NGO Registration Received";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const getNogIser = await UserService.getUserById(ngoId);
    const ngoName = getNogIser.name;
    const email = getNogIser.email;
    const phoneNumber = getNogIser.phone_number;
    const filePath = path.resolve(process.cwd(), "emailTemplates", "NGO_Registration_Received.html");
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*NGO_NAME\s*\}\}/g, ngoName || "");
    html = html.replace(/\{\{\s*NGO_EMAIL\s*\}\}/g, email || "");
    html = html.replace(/\{\{\s*NGO_PHONE_NUMBER\s*\}\}/g, phoneNumber || "");
    await sendEmail({ to, subject, html });
    if(email){
       await sendEmail({ to: email, subject, html }); 
    }
    
  }catch(error){
    console.log("Error sending NGO registration received email:", error?.message  || error);
     
  } 
}
export async function NGO_Approved(ngoId){
  try{
     const subject = "Your NGO Account Has Been Approved";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-ngo-approved.html");
    const getNogIser = await UserService.getUserById(ngoId);
    const ngoName = getNogIser.name;
    const email = getNogIser.email;
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*NGO_NAME\s*\}\}/g, ngoName || ""); // Replace all NGO_NAME placeholders
    html = html.replace(/\{\{\s*USERNAME\s*\}\}/g, email || ""); // Replace all USERNAME placeholders
    html = html.replace(/\{\{\s*LOGIN_URL\s*\}\}/g, process.env.FRONTEND_URL || ""); // Replace all LOGIN_URL placeholders
    if(!email){
      throw new Error("User email not found. Cannot send NGO approval email.");
    }
    await sendEmail({ to: email, subject, html });
    

  }catch(error){
    console.log("Error sending NGO approval email:", error?.message  || error);
     
  }


   
}
//ngo rejected email
export async function NGO_Rejected(ngoId){
  try{
    const subject = "Your NGO Account Has Been Rejected";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-ngo-rejected.html");
    const getNogIser = await UserService.getUserById(ngoId);
    const ngoName = getNogIser.name;
    const email = getNogIser.email;
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*NGO_NAME\s*\}\}/g, ngoName || ""); // Replace all NGO_NAME placeholders
    html = html.replace(/\{\{\s*USERNAME\s*\}\}/g, email || ""); // Replace all USERNAME placeholders
    html = html.replace(/\{\{\s*REJECTION_REASON\s*\}\}/g,  "Submit details incorrect"); // Replace all LOGIN_URL placeholders
    html = html.replace(/\{\{\s*REGISTRATION_URL\s*\}\}/g, process.env.FRONTEND_URL || ""); // Replace all LOGIN_URL placeholders
    if(!email){
      throw new Error("User email not found. Cannot send NGO rejection email.");
    }
    await sendEmail({ to:email, subject, html });
    
  }catch(error){
    console.log("Error sending NGO rejection email:", error?.message  || error);
     
  }
}
//new user by ngo email
export async function newUserbyNgo(userid){
  try{
    const subject = "New User Registration by NGO";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const getUser = await new Promise((resolve, reject) => {
      UserService.getAppUserProfile(userid, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
    const userName = getUser.name;
    const email = getUser.email;
    const phoneNumber = getUser.phone_number;
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-user-account-created.html");
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*PHONE_NUMMER\s*\}\}/g, phoneNumber || "");
    html = html.replace(/\{\{\s*LICENSE_KEY\s*\}\}/g, getUser?.licenses?.license_key);
    html = html.replace(/\{\{\s*DOWNLOAD_URL\s*\}\}/g, `${process.env.FRONTEND_URL}/dashboard/downloads`);
    html = html.replace(/\{\{\s*LOGIN_URL\s*\}\}/g, process.env.FRONTEND_URL || "");
    html = html.replace(/\{\{\s*NGO_NAME\s*\}\}/g, getUser?.ngo?.name || "");
    if(!email) {
      throw new Error("User email not found. Cannot send new user by NGO email.");
    }
    await sendEmail({ to:email, subject, html });
    
  }catch(error){
    console.log("Error sending new user by NGO email:", error?.message  || error);
     
  }
}

// Send license key after admin approval
export async function sendLicenseKeyAfterAdminApproval(userId) {
  try {
    const subject = "Admin approves KYC";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const getUser = await new Promise((resolve, reject) => {
      UserService.getAppUserProfile(userId, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
    
    const userName = getUser.name;
    const email = getUser.email;
    
    const phoneNumber = getUser.phone_number;
    console.log("phoneNumber",phoneNumber);
    const licenseKey = getUser?.licenses?.license_key;
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-license-key.html");
    const downloadUrl = `${process.env.FRONTEND_URL}/dashboard/downloads`;
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*PHONE_NUMBER\s*\}\}/g, phoneNumber || "");
    html = html.replace(/\{\{\s*LICENSE_KEY\s*\}\}/g, licenseKey || "");
    html = html.replace(/\{\{\s*DOWNLOAD_URL\s*\}\}/g, downloadUrl);
    html = html.replace(/\{\{\s*LOGIN_URL\s*\}\}/g, process.env.FRONTEND_URL || "");
    html = html.replace(/\{\{\s*NGO_NAME\s*\}\}/g, getUser?.ngo?.name || "");
    if(!email){
      throw new Error("User email not found. Cannot send license key email.");
    }
    await sendEmail({ to:email, subject, html });
    
  }catch (error) {
    console.error("Error sending license key email:", error?.message || error);
    
  }


}

// Send email after submitting KYC
export async function emailAfterSubmitKyc(userId) {
  //kobytech-kyc-submitted.html
  try{
    const subject = "KYC Submitted Successfully";
    const to = process.env.SMTP_FROM; // Admin email address to receive the notification
    const getUser = await new Promise((resolve, reject) => {
      UserService.getAppUserProfile(userId, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
    const getKycDocument = await new Promise((resolve, reject) => {
      KycService.getKycDocuments({ userId, payload: {}, headers: {} }, (err, kycDocument) => {
        if (err) {
          reject(err);
        } else {
          resolve(kycDocument);
        }
      });
    });
    const name = getKycDocument?.data?.name;
    const address = getKycDocument?.data?.address;
    const documentType = getKycDocument?.data?.document_type;

    const email = getUser.email;
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-kyc-submitted.html");
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace(/\{\{\s*FULL_NAME\s*\}\}/g, name || "");
    html = html.replace(/\{\{\s*USER_ADDRESS\s*\}\}/g, address || "");
    html = html.replace(/\{\{\s*DOCUMENT_TYPE\s*\}\}/g, documentType || "");
    if(!email){
      throw new Error("User email not found. Cannot send KYC submission email.");
    }
     
    await sendEmail({ to:email, subject, html });
    
  }catch(error){
    console.log("Error sending email after submitting KYC:", error?.message  || error);
    
  }


}

export async function sendAppFeedbackReplyEmail({ to, userName, message, feedbackId }) {
  try {
    const subject = "Reply to your app feedback";
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-app-feedback-reply.html");
    let html = fs.readFileSync(filePath, "utf-8");
    const safeName = userName || "User";
    const safeMessage = (message || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br/>");

    html = html.replace(/\{\{\s*USER_NAME\s*\}\}/g, safeName);
    html = html.replace(/\{\{\s*FEEDBACK_ID\s*\}\}/g, String(feedbackId || ""));
    html = html.replace(/\{\{\s*REPLY_MESSAGE\s*\}\}/g, safeMessage);

    await sendEmail({ to, subject, html });
  } catch (error) {
    console.log("Error sending app feedback reply email:", error?.message || error);
    throw error;
  }
}

export async function sendRequestIosAccessReplyEmail({ to, userName, message, requestId }) {
  try {
    const subject = "Reply to your iOS access request";
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-request-ios-access-reply.html");
    let html = fs.readFileSync(filePath, "utf-8");
    const safeName = userName || "User";
    const safeMessage = (message || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br/>");

    html = html.replace(/\{\{\s*USER_NAME\s*\}\}/g, safeName);
    html = html.replace(/\{\{\s*REQUEST_ID\s*\}\}/g, String(requestId || ""));
    html = html.replace(/\{\{\s*REPLY_MESSAGE\s*\}\}/g, safeMessage);

    await sendEmail({ to:'pritam.biswas489@gmail.com', subject, html });
  } catch (error) {
    console.log("Error sending iOS access reply email:", error?.message || error);
    throw error;
  }
}

export async function sendContactAdminReplyEmail({ to, userName, message, contactId }) {
  try {
    const subject = "Reply to your Contact Admin message";
    const filePath = path.resolve(process.cwd(), "emailTemplates", "kobytech-contact-admin-reply.html");
    let html = fs.readFileSync(filePath, "utf-8");
    const safeName = userName || "User";
    const safeMessage = (message || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br/>");

    html = html.replace(/\{\{\s*USER_NAME\s*\}\}/g, safeName);
    html = html.replace(/\{\{\s*CONTACT_ID\s*\}\}/g, String(contactId || ""));
    html = html.replace(/\{\{\s*REPLY_MESSAGE\s*\}\}/g, safeMessage);

    await sendEmail({ to, subject, html });
  } catch (error) {
    console.log("Error sending contact admin reply email:", error?.message || error);
    throw error;
  }
}