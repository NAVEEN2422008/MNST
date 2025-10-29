const crypto = require('crypto');

// Encryption configuration
const algorithm = 'aes-256-gcm';
const keyLength = 32; // 256 bits
const ivLength = 16; // 128 bits
const saltLength = 64;
const tagLength = 16;

// Get encryption key from environment variable
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return crypto.scryptSync(key, 'salt', keyLength);
};

// Encrypt data
const encrypt = (text) => {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(ivLength);
    const salt = crypto.randomBytes(saltLength);

    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(salt);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Return format: salt:iv:tag:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data
const decrypt = (encryptedText) => {
  try {
    const key = getKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash sensitive data (one-way)
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate secure random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Validate encrypted data integrity
const validateEncryptedData = (encryptedText) => {
  try {
    const parts = encryptedText.split(':');
    return parts.length === 4 &&
           parts[0].length === saltLength * 2 &&
           parts[1].length === ivLength * 2 &&
           parts[2].length === tagLength * 2 &&
           parts[3].length > 0;
  } catch (error) {
    return false;
  }
};

module.exports = {
  encrypt,
  decrypt,
  hashData,
  generateToken,
  validateEncryptedData
};
