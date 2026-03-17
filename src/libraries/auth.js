import '../config/environment.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { genSaltSync, hashSync, compare } = bcrypt;

export const hashStr = async (str) => {
	const salt = genSaltSync(10);
	const hash = hashSync(str, salt);
	return hash;
};
export const compareHashedStr = async (str, hashStr) => {
	const check = await compare(str, hashStr);
	return check;
};

export const generateToken = async (payload, algorithm, secretKey, expiresIn) => {
	const token = jwt.sign(payload, secretKey, { expiresIn, algorithm });
	return token;
};
