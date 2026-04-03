import CryptoJS from 'crypto-js';
const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-secret-key';


export const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, secretKey).toString();
};

export const decryptToken = (encryptedToken: string): string | null => {
  try {
    if (!encryptedToken) {
      return null;
    }

    // If it's already a raw JWT (starts with eyJ), return as-is
    if (encryptedToken.startsWith('eyJ')) {
      return encryptedToken;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedData) {
      return encryptedToken;
    }

    return decryptedData;
  } catch (error) {
    return encryptedToken;
  }
};

/*import CryptoJS from 'crypto-js';

const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-secret-key';

export const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, secretKey).toString();
};

export const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
  const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedToken) {
    throw new Error('Failed to decrypt token');
  }
  return decryptedToken;
};*/

/*import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-encryption-key';
const iv = crypto.randomBytes(16);

export const encryptToken = (token: string): string => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptToken = (encryptedToken: string): string => {
  const [ivHex, encrypted] = encryptedToken.split(':');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
  return decrypted.toString();
};
*/