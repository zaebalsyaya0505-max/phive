/**
 * Double Envelope Encryption Module
 * Security Engineer Implementation
 * 
 * Outer: ChaCha20-Poly1305 (client key)
 * Inner: AES-256-GCM (server key)
 */

const crypto = require('crypto');

/**
 * Double envelope encryption for covert channel
 */
class CovertEncryption {
    constructor() {
        this.masterKey = this._deriveKey(process.env.COVERT_MASTER_KEY);
        this.prevKey = process.env.COVERT_MASTER_KEY_PREV 
            ? this._deriveKey(process.env.COVERT_MASTER_KEY_PREV)
            : null;
    }

    /**
     * Derive 32-byte key from environment variable
     */
    _deriveKey(keyStr) {
        if (!keyStr) {
            // Fallback key for development (NOT FOR PRODUCTION)
            return crypto.scryptSync('covert-dev-key', 'salt', 32);
        }
        // Use provided key or hash it to 32 bytes
        const key = Buffer.from(keyStr, 'hex');
        if (key.length === 32) return key;
        return crypto.scryptSync(keyStr, 'covert-salt', 32);
    }

    /**
     * Server-side decrypt (inner layer only - AES-256-GCM)
     * Client should have removed outer ChaCha20 layer
     * @param {Buffer} encryptedData - Data to decrypt
     * @returns {Object} Decrypted payload
     */
    decrypt(encryptedData) {
        try {
            // Try current key first
            return this._tryDecrypt(encryptedData, this.masterKey);
        } catch (e) {
            // Try previous key (rotation window)
            if (this.prevKey) {
                return this._tryDecrypt(encryptedData, this.prevKey);
            }
            throw new Error('Decryption failed: invalid key or corrupted data');
        }
    }

    /**
     * Attempt decryption with specific key
     */
    _tryDecrypt(data, key) {
        // Packet format:
        // [1 byte]  - Version (0x01)
        // [8 bytes] - Timestamp (big-endian)
        // [2 bytes] - Payload length
        // [N bytes] - Ciphertext
        // [16 bytes] - GCM auth tag
        
        if (data.length < 28) {
            throw new Error('Data too short');
        }

        const version = data[0];
        if (version !== 0x01) {
            throw new Error('Unsupported version');
        }

        const timestamp = data.readUInt32BE(1) * 4294967296 + data.readUInt32BE(5);
        const payloadLength = data.readUInt16BE(9);
        
        if (data.length !== 11 + payloadLength + 16) {
            throw new Error('Invalid packet length');
        }

        const nonce = data.slice(1, 13); // Use timestamp + version as nonce
        const ciphertext = data.slice(11, 11 + payloadLength);
        const authTag = data.slice(11 + payloadLength);

        // AES-256-GCM decryption
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(authTag);
        
        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);

        // Verify timestamp (reject old messages > 5 minutes)
        const now = Date.now();
        if (Math.abs(now - timestamp) > 300000) {
            throw new Error('Message too old or future timestamp');
        }

        return {
            timestamp,
            payload: JSON.parse(plaintext.toString('utf8'))
        };
    }

    /**
     * Server-side encrypt (for responses)
     */
    encrypt(payload) {
        const timestamp = Date.now();
        const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
        
        // Nonce from timestamp (12 bytes for GCM)
        const nonce = Buffer.allocUnsafe(12);
        nonce[0] = 0x01; // Version
        nonce.writeUInt32BE(Math.floor(timestamp / 4294967296), 1);
        nonce.writeUInt32BE(timestamp % 4294967296, 5);
        nonce.writeUInt32BE(crypto.randomInt(4294967296), 9);

        // AES-256-GCM encryption
        const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, nonce);
        const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Packet assembly
        const lengthBuf = Buffer.allocUnsafe(2);
        lengthBuf.writeUInt16BE(ciphertext.length, 0);

        return Buffer.concat([
            Buffer.from([0x01]), // Version
            nonce.slice(1),      // Timestamp (8 bytes)
            lengthBuf,           // Length (2 bytes)
            ciphertext,          // Payload
            authTag              // Auth tag (16 bytes)
        ]);
    }

    /**
     * Generate ECDH keypair for session establishment
     */
    generateSessionKeys() {
        return crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256r1',
            publicKeyEncoding: { type: 'uncompressed', format: 'der' },
            privateKeyEncoding: { type: 'pkcs8', format: 'der' }
        });
    }

    /**
     * Derive shared secret from ECDH
     */
    deriveSharedSecret(privateKey, publicKey) {
        return crypto.diffieHellman({
            privateKey: crypto.createPrivateKey({
                key: privateKey,
                format: 'der',
                type: 'pkcs8'
            }),
            publicKey: crypto.createPublicKey({
                key: publicKey,
                format: 'der',
                type: 'spki'
            })
        });
    }

    /**
     * HKDF key derivation
     */
    hkdf(sharedSecret, salt, info, length = 32) {
        const prk = crypto.createHmac('sha256', salt).update(sharedSecret).digest();
        const okm = crypto.createHmac('sha256', prk)
            .update(Buffer.concat([Buffer.from(info), Buffer.from([1])]))
            .digest()
            .slice(0, length);
        return okm;
    }
}

/**
 * Client-side encryption helper (for reference)
 * In production, this runs on mobile app
 */
class ClientEncryption {
    /**
     * Double envelope encrypt (client to server)
     * Outer: ChaCha20-Poly1305 with session key
     * Inner: AES-256-GCM with server public key
     */
    static doubleEncrypt(plaintext, serverPublicKey, clientSessionKey) {
        // Step 1: AES-256-GCM (inner layer)
        const innerNonce = crypto.randomBytes(12);
        const innerCipher = crypto.createCipheriv('aes-256-gcm', serverPublicKey, innerNonce);
        const innerCiphertext = Buffer.concat([innerCipher.update(plaintext), innerCipher.final()]);
        const innerTag = innerCipher.getAuthTag();
        
        const innerPacket = Buffer.concat([innerNonce, innerCiphertext, innerTag]);
        
        // Step 2: ChaCha20-Poly1305 (outer layer)
        const outerNonce = crypto.randomBytes(12);
        const outerCipher = crypto.createCipheriv('chacha20-poly1305', clientSessionKey, outerNonce);
        const outerCiphertext = Buffer.concat([outerCipher.update(innerPacket), outerCipher.final()]);
        const outerTag = outerCipher.getAuthTag();
        
        return Buffer.concat([outerNonce, outerCiphertext, outerTag]);
    }

    /**
     * Client-side ChaCha20 decrypt (for responses)
     */
    static chaCha20Decrypt(ciphertext, key) {
        const nonce = ciphertext.slice(0, 12);
        const encrypted = ciphertext.slice(12, -16);
        const tag = ciphertext.slice(-16);
        
        const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce);
        decipher.setAuthTag(tag);
        
        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }
}

module.exports = {
    CovertEncryption,
    ClientEncryption
};
