import "../config/environment.js";
import db from "../databases/models/index.js";
const { User, Licenses } = db;
import { hashStr , compareHashedStr, generateToken} from "../libraries/auth.js";
import { randomSaltHex } from "../libraries/utility.js";
import * as Sentry from "@sentry/node";
import KycService from "./kyc.service.js";
import UserService from "./user.service.js";
 

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
    // Service method for registering a user under an NGO
    static async registerUserForNgo({ file, payload, headers }, callback) {
        const ngoDetails = await User.findOne({ where: { id: payload.ngo_id, role: "NGO" } });
        if(ngoDetails.ngo_number_of_user_assigned === ngoDetails.ngo_number_of_user_registered){
            return callback(new Error("NGO_USER_LIMIT_REACHED"));
        }
        const transaction = await db.sequelize.transaction();
        try{
            if(!file?.path){
                return callback(new Error("NGO_CERTIFICATE_FILE_REQUIRED"));
            }
            const {
              fullName,
              emailAddress,
              phoneNumber,
              documentType,
              residentialAddress,
              ngo_id
            } = payload;

            const checkExistingUser = await User.findOne({ where: { phone_number: phoneNumber, role: "USER" } });
            if (checkExistingUser) {
                return callback(new Error("USER_PHONE_NUMBER_ALREADY_REGISTERED"));
            }
            const createUser = await User.create({
                name: fullName,
                email: emailAddress,
                phone_number: phoneNumber,
                ngo_id: ngo_id,

            },{
                transaction
            });
            if(!createUser){
                await transaction.rollback();
                return callback(new Error("USER_CREATION_FAILED"));
            }
            //upload document in user table
            let kycError = null;
            let kycResult = {};
            await KycService.submitKycDocuments(
                {
                    userId: createUser.id,
                    payload: {
                        fullName,
                        residentialAddress,
                        documentType
                    },
                    file,
                    headers,
                    transaction
                },
                (err, result) => {
                    if (err) kycError = err;
                    kycResult = result?.data;
                }
            );
            if (kycError) {
                await transaction.rollback();
                return callback(kycError);
            }
            //assign license number for user
            const licenseNumber = `KBY-${String(ngo_id).padStart(2, '0')}-${String(createUser.id).padStart(6, '0')}`;
            const licenseData = {
                    user_id: createUser.id,
                    license_key: licenseNumber,
                    status: "active",
            };
            const license = await Licenses.create(licenseData, { transaction });
            if(!license){
                await transaction.rollback();
                return callback(new Error("LICENSE_CREATION_FAILED"));
            }
            await transaction.commit();
            //auto approve KYC document for NGO registered user
            await KycService.changeStatus(
                { userId: createUser.id, payload: { status: "approved" }, headers, transaction },
                (err, result) => {} 
            );
            return callback(null, { data: { user: createUser, kycDocument: kycResult, license } });
        }catch(error){
            console.error("Error in registerUserForNgo:", error);
            process.env.NODE_ENV === "production" && Sentry.captureException(error);
            await transaction.rollback();
            return callback(new Error("REGISTER_USER_FOR_NGO_FAILED"));
        }
    }
    
}