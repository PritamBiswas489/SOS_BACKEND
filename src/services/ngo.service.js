import "../config/environment.js";
import db from "../databases/models/index.js";
const { User } = db;
import { hashStr , compareHashedStr, generateToken} from "../libraries/auth.js";
import { randomSaltHex } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";

export default class NgoService {
    static async registerNgo({ payload }, callback) {
        try{
            const { name, email, phoneNumber, password, numberOfUser, certificateFile } = payload;
            const existingUser = await User.findOne({ where: { email, role: "NGO" } });
            if (existingUser) {
                return callback(new Error("NGO_EMAIL_ALREADY_REGSISTERED"));
            }
            const salt = randomSaltHex(16);
            const hashedPassword = await hashStr(password + salt);
            const newNgo = await User.create({
                name,
                email,
                phone_number: phoneNumber,
                password_hash: hashedPassword,
                hex_salt:salt,
                ngo_number_of_user_assigned: numberOfUser,
                ngo_certificate: certificateFile,
                role: "NGO",
            });
            return callback(null, { data: { id: newNgo.id, name: newNgo.name, email: newNgo.email } });
        }catch(error){
            console.error("Error in registerNgo:", error);
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            return callback(new Error("REGISTER_NGO_FAILED"));
        }
    }
    static async ngoLogin({ payload }, callback) {
       console.log("payload in service", payload);
       try{
        const { email, password } = payload;
        const ngoUser = await User.findOne({ where: { email, role: "NGO" } });
        if (!ngoUser) {
            return callback(new Error("NGO_NOT_FOUND"));
        }
        console.log("NGO user found:", {password, ngoUserPasswordHash: ngoUser.password_hash});

        // Add password verification logic here
        const isPasswordValid = await compareHashedStr(password + ngoUser.hex_salt, ngoUser.password_hash);
        if (!isPasswordValid) {
            return callback(new Error("NGO_INVALID_PASSWORD"));
        }
        if(ngoUser.is_active === false){
            return callback(new Error("DEACTIVATED_BY_SYSTEM_ADMIN"));
        }
        if(ngoUser.is_verified === false){
            return callback(new Error("NGO_NOT_VERIFIED_YET"));
        }
        const payloadJwt = {
            id: ngoUser.id,
            phoneNumber: ngoUser.phone_number,
            email: ngoUser.email,
            role: ngoUser.role,
        };
        const accessToken = await generateToken(payloadJwt, process.env.JWT_ALGO, process.env.ACCESS_TOKEN_SECRET_KEY, Number(process.env.ACCESS_TOKEN_EXPIRES_IN));
        const refreshToken = await generateToken(payloadJwt, process.env.JWT_ALGO, process.env.REFRESH_TOKEN_SECRET_KEY, Number(process.env.REFRESH_TOKEN_EXPIRES_IN));
        const userData = ngoUser.toJSON();
        delete userData.password_hash;
        delete userData.hex_salt;
        delete userData.ngo_certificate;
        return callback(null, { data: { user: userData, accessToken, refreshToken } });
          

       }catch(error){
        console.error("Error in ngoLogin:", error);
        process.env.NODE_ENV === "production" && Sentry.captureException(error);
        return callback(new Error("NGO_LOGIN_FAILED"));
       }
    }
    
}