/**
 * Steganography Module - Security Engineer Implementation
 * Hides covert admin data in seemingly legitimate traffic
 */

const crypto = require('crypto');

/**
 * EXIF Metadata Encoder/Decoder
 * Embeds data in image metadata (GPS coordinates, camera model, etc.)
 */
class ExifSteganography {
    /**
     * Encode payload into EXIF structure
     * @param {Object} exifBase - Base EXIF structure
     * @param {Object} payload - Data to encode
     * @returns {Object} Modified EXIF with hidden data
     */
    static encode(exifBase, payload) {
        const payloadStr = JSON.stringify(payload);
        const encoded = Buffer.from(payloadStr).toString('base64');
        
        // Split payload across multiple fields for stealth
        const chunks = this._chunkString(encoded, 32);
        
        return {
            ...exifBase,
            '0th': {
                ...exifBase['0th'],
                [0x010F]: 'Canon', // Make
                [0x0110]: chunks[0] || 'EOS R5', // Model = first chunk
                [0x0131]: chunks[1] || 'Adobe Lightroom', // Software = second chunk
                [0x0132]: chunks[2] || '2024:01:15 14:30:00', // DateTime = third chunk
            },
            'GPS': {
                ...exifBase['GPS'],
                // Encode numeric data in GPS coordinates
                'GPSLatitude': this._encodeNumberToGPS(payload.userId || 0),
                'GPSLongitude': this._encodeNumberToGPS(payload.timestamp || Date.now()),
                'GPSAltitude': [payload.sessionId || 0, 1],
            }
        };
    }

    /**
     * Decode payload from EXIF structure
     * @param {Object} exifData - EXIF data with potential hidden payload
     * @returns {Object|null} Decoded payload or null
     */
    static decode(exifData) {
        try {
            const ifd0 = exifData['0th'] || {};
            const model = ifd0[0x0110];
            const software = ifd0[0x0131];
            const datetime = ifd0[0x0132];
            
            // Reconstruct from chunks
            let encoded = '';
            if (model && model.includes('=')) encoded += model;
            if (software && software.includes('=')) encoded += software;
            if (datetime && datetime.includes('=')) encoded += datetime;
            
            if (!encoded) return null;
            
            const payload = Buffer.from(encoded, 'base64').toString('utf8');
            return JSON.parse(payload);
        } catch (e) {
            return null;
        }
    }

    static _chunkString(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.slice(i, i + size));
        }
        return chunks;
    }

    static _encodeNumberToGPS(num) {
        // Encode number as DMS (Degrees, Minutes, Seconds)
        const deg = Math.floor(num / 10000) % 90;
        const min = Math.floor((num % 10000) / 100);
        const sec = num % 100;
        return [[deg, 1], [min, 1], [sec, 1]];
    }

    static _decodeGPSToNumber(gpsArray) {
        if (!gpsArray || gpsArray.length !== 3) return 0;
        return gpsArray[0][0] * 10000 + gpsArray[1][0] * 100 + gpsArray[2][0];
    }
}

/**
 * HTTP Header Steganography
 * Hides data in seemingly normal HTTP headers
 */
class HeaderSteganography {
    /**
     * Encode data into headers
     * @param {Object} baseHeaders - Legitimate headers
     * @param {Buffer} payload - Data to hide
     * @returns {Object} Headers with embedded payload
     */
    static encode(baseHeaders, payload) {
        const headers = { ...baseHeaders };
        
        // Encode in Accept-Language q-values
        const payloadHex = payload.toString('hex');
        const langCodes = ['en-US', 'en', 'ru', 'fr', 'de', 'es'];
        const qValues = this._hexToQValues(payloadHex, langCodes.length);
        
        headers['Accept-Language'] = langCodes
            .map((lang, i) => `${lang};q=0.${qValues[i] || 9}`)
            .join(',');
        
        // Encode in X-Request-ID (UUID with embedded data)
        headers['X-Request-ID'] = this._embedInUUID(payload.slice(0, 16));
        
        // Encode in Referer query string (if applicable)
        if (headers['Referer']) {
            const url = new URL(headers['Referer']);
            url.searchParams.set('ref', payload.slice(16, 32).toString('base64url'));
            headers['Referer'] = url.toString();
        }
        
        return headers;
    }

    /**
     * Decode data from headers
     * @param {Object} headers - HTTP headers
     * @returns {Buffer|null} Decoded payload
     */
    static decode(headers) {
        try {
            const parts = [];
            
            // Extract from Accept-Language
            const acceptLang = headers['accept-language'] || '';
            const qMatch = acceptLang.match(/q=0\.(\d)/g);
            if (qMatch) {
                const hex = qMatch.map(m => m.match(/q=0\.(\d)/)[1]).join('');
                parts.push(Buffer.from(hex, 'hex'));
            }
            
            // Extract from X-Request-ID
            const requestId = headers['x-request-id'] || '';
            const uuidData = this._extractFromUUID(requestId);
            if (uuidData) parts.push(uuidData);
            
            // Extract from Referer
            const referer = headers['referer'] || '';
            const refMatch = referer.match(/ref=([A-Za-z0-9_-]+)/);
            if (refMatch) {
                parts.push(Buffer.from(refMatch[1], 'base64url'));
            }
            
            if (parts.length === 0) return null;
            return Buffer.concat(parts);
        } catch (e) {
            return null;
        }
    }

    static _hexToQValues(hex, count) {
        const values = [];
        for (let i = 0; i < count; i++) {
            const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
            values.push(Math.floor((byte / 255) * 9) + 1);
        }
        return values;
    }

    static _embedInUUID(data) {
        // Create UUID with embedded data in version/variant fields
        const hex = data.toString('hex').padEnd(32, '0');
        // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        // 4 = version, y = variant (8,9,a,b)
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.slice(18, 32)}`;
    }

    static _extractFromUUID(uuid) {
        if (!uuid || uuid.length !== 36) return null;
        const clean = uuid.replace(/-/g, '');
        if (clean.length !== 32) return null;
        // Extract bytes from non-fixed positions
        const data = clean.slice(0, 12) + clean.slice(16, 20) + clean.slice(21);
        return Buffer.from(data.slice(0, 32), 'hex');
    }
}

/**
 * Timing Channel Encoder
 * Encodes data in inter-request timing patterns
 */
class TimingSteganography {
    constructor() {
        this.baseInterval = 100; // ms
        this.bit0Delay = 100;   // ms
        this.bit1Delay = 200;  // ms
        this.separatorDelay = 300; // ms
    }

    /**
     * Encode bits into timing sequence
     * @param {Buffer} data - Data to encode
     * @returns {number[]} Array of delays in ms
     */
    encode(data) {
        const bits = this._bufferToBits(data);
        const delays = [];
        
        for (let i = 0; i < bits.length; i++) {
            delays.push(bits[i] === 0 ? this.bit0Delay : this.bit1Delay);
            // Add separator every 8 bits
            if ((i + 1) % 8 === 0 && i < bits.length - 1) {
                delays.push(this.separatorDelay);
            }
        }
        
        return delays;
    }

    /**
     * Decode timing sequence to data
     * @param {number[]} delays - Array of measured delays
     * @returns {Buffer|null} Decoded data
     */
    decode(delays) {
        try {
            const bits = [];
            for (const delay of delays) {
                if (Math.abs(delay - this.bit0Delay) < 30) {
                    bits.push(0);
                } else if (Math.abs(delay - this.bit1Delay) < 30) {
                    bits.push(1);
                }
                // Separator ignored
            }
            
            return this._bitsToBuffer(bits);
        } catch (e) {
            return null;
        }
    }

    _bufferToBits(buffer) {
        const bits = [];
        for (const byte of buffer) {
            for (let i = 7; i >= 0; i--) {
                bits.push((byte >> i) & 1);
            }
        }
        return bits;
    }

    _bitsToBuffer(bits) {
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8 && i + j < bits.length; j++) {
                byte = (byte << 1) | bits[i + j];
            }
            bytes.push(byte);
        }
        return Buffer.from(bytes);
    }
}

/**
 * WebSocket Frame Padding Steganography
 * Hides data in WebSocket binary frame padding
 */
class WebSocketSteganography {
    /**
     * Create a covert WebSocket frame
     * @param {Buffer} payload - Data to hide
     * @returns {Buffer} Frame payload with hidden data
     */
    static createFrame(payload) {
        // Frame structure:
        // [0x00 0x01] - Heartbeat sequence (cover)
        // [padding]   - Random bytes (entropy mask)
        // [length]    - 2 bytes, big-endian
        // [payload]   - Encrypted data
        
        const paddingLength = Math.floor(Math.random() * 16) + 8;
        const padding = crypto.randomBytes(paddingLength);
        const lengthBuf = Buffer.allocUnsafe(2);
        lengthBuf.writeUInt16BE(payload.length, 0);
        
        return Buffer.concat([
            Buffer.from([0x00, 0x01]), // Heartbeat cover
            padding,                   // Random padding
            lengthBuf,                 // Payload length
            payload                    // Actual data
        ]);
    }

    /**
     * Extract hidden data from WebSocket frame
     * @param {Buffer} frame - Received frame data
     * @returns {Buffer|null} Extracted payload
     */
    static extractFrame(frame) {
        try {
            // Skip heartbeat bytes
            if (frame.length < 4 || frame[0] !== 0x00 || frame[1] !== 0x01) {
                return null;
            }
            
            // Skip random padding (variable length, detect by looking for valid length)
            let offset = 2;
            while (offset < frame.length - 2) {
                const claimedLength = frame.readUInt16BE(offset);
                if (claimedLength > 0 && claimedLength < 8192 && 
                    offset + 2 + claimedLength <= frame.length) {
                    return frame.slice(offset + 2, offset + 2 + claimedLength);
                }
                offset++;
            }
            
            return null;
        } catch (e) {
            return null;
        }
    }
}

module.exports = {
    ExifSteganography,
    HeaderSteganography,
    TimingSteganography,
    WebSocketSteganography
};
