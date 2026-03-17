import KycService from "../services/kyc.service.js";
const uuid = "97bbb797-4ddf-4573-9728-d8c1c4af7cc5"; 
const applicantId = "6878c1cafe1fec989d151244";
const inspectionId = "687a1764c8f20e7815e35c1a";
await KycService.kycSaveUserDocuments({ uuid, applicantId, inspectionId });