import "../config/environment.js";
import * as Sentry from "@sentry/node";
import axios from "axios";
import e from "express";
import crypto from "crypto";
import fs from "fs";
import FormData from "form-data";

export default class KessPayApiService {
  static async accessToken() {
    try {
      const response = await axios.post(
        `${process.env.KESSPAY_API_URL}/oauth/token`,
        {
          grant_type: "password",
          client_id: process.env.KESSPAY_CLIENT_ID,
          client_secret: process.env.KESSPAY_CLIENT_SECRET,
          username: process.env.KESSPAY_USERNAME,
          password: process.env.KESSPAY_PASSWORD,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (e) {
      console.log("PisoPay access token error:", e.message);
      if (process.env.SENTRY_ENABLED === "true") {
        Sentry.captureException(e);
      }
      throw e;
    }
  }
  static makeSign(param, key) {
    const signType = param["sign_type"];

    let string = this.toUrlParams(param);
    string = string + "&key=" + key;

    if (signType === "MD5") {
        string = crypto.createHash('md5').update(string).digest('hex');
    } else if (signType === "HMAC-SHA256") {
        string = crypto.createHmac('sha256', key).update(string).digest('hex');
    }

    return string;
}
  static toUrlParams(values) {
    values = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== null)
    );

    const sortedKeys = Object.keys(values).sort();

    let buff = "";

    for (const k of sortedKeys) {
      const v = values[k];

      if (
        k !== "sign" &&
        v !== "" &&
        !Array.isArray(v) &&
        typeof v !== "object"
      ) {
        buff += k + "=" + v + "&";
      }
    }

    // Remove trailing '&'
    buff = buff.replace(/&$/, "");

    return buff;
  }
  static async decodeKHQR({ token, qrCode, i18n }, callback) {
    try {
      const params = {
        service: "webpay.acquire.decodeKhqr",
        sign_type: "MD5",
        qrcode: qrCode,
      };
      params["sign"] = this.makeSign(params, process.env.KESSPAY_API_SECRET_KEY);
      const response = await axios.post(`${process.env.KESSPAY_API_URL}/api/mch/v2/gateway`, params, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
      if(response?.data?.success === true){
        return callback(null, {data: response.data.data});
      }else{
        console.error("KessPay decodeKHQR failed:", response.data);
        return callback(new Error("DECODE_QRCODE_FAILED"), null);
      }
    } catch (err) {
      console.error("Error in decodeKHQR:", err.message);
      return callback(new Error("DECODE_QRCODE_FAILED"), null);
    }
  }

  static async scanKHQR({ token, data, i18n }, callback) {
    try {
      const params = {...data,
        service: "webpay.acquire.payKhqr",
        sign_type: "MD5",
        remark: "Scan KHQR Payment",
        seller_code: process.env.KESSPAY_SELLER_CODE,
      };
      params["sign"] = this.makeSign(params, process.env.KESSPAY_API_SECRET_KEY);
      console.log("KessPay scanKHQR params:", params);
      const response = await axios.post(`${process.env.KESSPAY_API_URL}/api/mch/v2/gateway`, params, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("KessPay scanKHQR response:", response.data);
        return callback(null, {...response.data});
    } catch (err) {
      console.error("Error in scanKHQR:", err);
      return callback(new Error("BUY_EXPENSE_FAILED"), null);
    }
  }


  static async createUser({ token, data, i18n }, callback) {
     try{

       const params = {...data,
        service: "webpay.acquire.adduserundermerchant",
        sign_type: "MD5",
        seller_code: process.env.KESSPAY_SELLER_CODE,
      };
      params["sign"] = this.makeSign(params, process.env.KESSPAY_API_SECRET_KEY);
      console.log("KessPay createUser params:", params);
      const response = await axios.post(`${process.env.KESSPAY_API_URL}/api/mch/v2/gateway`, params, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return callback(null, {...response.data});
     }catch(err){
       return callback(new Error(err.message), null);
     }
  }
  static async updateKyc({ token, data, i18n }, callback) {
      try{
        const user_id = data.user_id;
        const files = data.document_files;

        console.log("KessPay getUserDetails user_id:", user_id);
        console.log("KessPay getUserDetails document_files:", files);

        const params = {
         service: "webpay.acquire.uploadUserKyc",
         sign_type: "MD5",
         seller_code: process.env.KESSPAY_SELLER_CODE,
         user_id: user_id,
        };
        console.log("KessPay updateKyc params before files:", params);
        const sign = this.makeSign(params, process.env.KESSPAY_API_SECRET_KEY);

       
        const formData = new FormData();
        formData.append('service', 'webpay.acquire.uploadUserKyc');
        formData.append('sign_type', 'MD5');
        formData.append('seller_code', process.env.KESSPAY_SELLER_CODE);
        formData.append('user_id', user_id);
        formData.append('sign', sign);
        formData.append('attachments[front]', fs.createReadStream(files.find(f => f.documentType === 'FRONT_SIDE').documentPath));
        formData.append('attachments[back]', fs.createReadStream(files.find(f => f.documentType === 'BACK_SIDE').documentPath));
        formData.append('attachments[selfe]', fs.createReadStream(files.find(f => f.documentType === 'SELFIE').selfiePath));


        // console.log("KessPay updateKyc formData:", formData);

        const response = await axios.post(`${process.env.KESSPAY_API_URL}/api/mch/v2/upload-attachments`, formData, {
              headers: {
                  ...formData.getHeaders(),
                  'Authorization': `Bearer ${token}`
              }
          });

          console.log("KessPay updateKyc response:", response);
          return callback(null, {...response.data});
      }catch(err){
        console.error("Error in updateKyc2:", err);
        return callback(new Error(err.message), null);
      }

  }
  static async getUserProfile({ token, user_id, i18n }, callback) {
    console.log("KessPay getUserProfile user_id:", user_id);
    try {
      const params = {
        service: "webpay.acquire.userprofile",
        sign_type: "MD5",
        seller_code: process.env.KESSPAY_SELLER_CODE,
        user_id: user_id,
      };
      params["sign"] = this.makeSign(params, process.env.KESSPAY_API_SECRET_KEY);
      console.log("KessPay getUserProfile params:", params);
      const response = await axios.post(`${process.env.KESSPAY_API_URL}/api/mch/v2/gateway`, params, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("KessPay getUserProfile response:", response.data);
        return callback(null, {...response.data});
    }catch (err) {
      console.error("Error in getUserProfile:", err);
      return callback(new Error("GET_USER_PROFILE_FAILED"), null);
    }


  }
}
