/**
 * Dead Drop: Media Upload (Avatar/Images)
 * Security Engineer Implementation
 * 
 * Cover: User avatar/image upload
 * Hidden: Admin data in EXIF metadata
 * Path: POST /api/v1/media/upload
 */

const { CovertEncryption } = require('../../../covert/lib/crypto');
const { ExifSteganography } = require('../../../covert/lib/steganography');

const crypto = new CovertEncryption();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Upload-ID');
    res.setHeader('Access-Control-Expose-Headers', 'X-Media-ID, X-Processing-Time');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }

    try {
        // Parse multipart form data
        const { imageBuffer, metadata } = await parseMultipartRequest(req);
        
        if (!imageBuffer) {
            res.status(400).json({ error: 'no_image_data' });
            return;
        }

        // Extract EXIF data
        const exifData = await extractExifData(imageBuffer);
        
        // Attempt to decode covert payload from EXIF
        let covertPayload = null;
        if (exifData) {
            covertPayload = ExifSteganography.decode(exifData);
            
            if (covertPayload) {
                // Extract encrypted data from EXIF structure
                const encryptedData = extractEncryptedDataFromExif(exifData);
                if (encryptedData) {
                    try {
                        const decrypted = crypto.decrypt(encryptedData);
                        await processCovertData(decrypted, metadata);
                    } catch (e) {
                        // Failed to decrypt - might be regular image
                    }
                }
            }
        }
        
        // Process as legitimate image upload
        const mediaId = generateMediaId();
        const processedImage = await processImage(imageBuffer, metadata);
        
        // Return decoy response
        const response = createDecoyResponse(mediaId, processedImage, covertPayload !== null);
        
        // Add covert acknowledgment in headers if data was received
        if (covertPayload) {
            res.setHeader('X-Media-ID', generateCovertAck(covertPayload.sessionId || metadata?.sessionId));
            res.setHeader('X-Processing-Time', encodeProcessingHint(covertPayload));
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Media upload error:', error.message);
        res.status(200).json(createDecoyResponse(generateMediaId(), null, false));
    }
};

/**
 * Parse multipart form data from request
 */
async function parseMultipartRequest(req) {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
        // Try to parse as raw binary
        return {
            imageBuffer: Buffer.isBuffer(req.body) ? req.body : null,
            metadata: req.body?.metadata || {}
        };
    }
    
    // Simple multipart parser
    const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
    if (!boundary) {
        return { imageBuffer: null, metadata: {} };
    }
    
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    const parts = parseMultipartBody(body, boundary);
    
    let imageBuffer = null;
    let metadata = {};
    
    for (const part of parts) {
        const disposition = part.headers['content-disposition'] || '';
        
        if (disposition.includes('name="image"') || disposition.includes('name="file"')) {
            imageBuffer = part.data;
        } else if (disposition.includes('name="metadata"')) {
            try {
                metadata = JSON.parse(part.data.toString('utf8'));
            } catch (e) {
                metadata = {};
            }
        }
    }
    
    return { imageBuffer, metadata };
}

/**
 * Simple multipart parser
 */
function parseMultipartBody(body, boundary) {
    const parts = [];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    let start = body.indexOf(boundaryBuffer);
    
    while (start !== -1) {
        const end = body.indexOf(boundaryBuffer, start + boundaryBuffer.length);
        if (end === -1) break;
        
        const part = body.slice(start + boundaryBuffer.length, end);
        const headerEnd = part.indexOf('\r\n\r\n');
        
        if (headerEnd !== -1) {
            const headerSection = part.slice(2, headerEnd).toString('utf8');
            const data = part.slice(headerEnd + 4, part.length - 2);
            
            const headers = {};
            headerSection.split('\r\n').forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    headers[key.toLowerCase()] = value;
                }
            });
            
            parts.push({ headers, data });
        }
        
        start = end;
    }
    
    return parts;
}

/**
 * Extract EXIF data from image buffer
 */
async function extractExifData(imageBuffer) {
    try {
        // Look for EXIF marker (FF D8 FF E1 or FF D8 FF E0 for JPEG)
        if (imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
            return null; // Not a JPEG
        }
        
        // Find APP1 marker (0xFFE1) for EXIF
        let offset = 2;
        while (offset < imageBuffer.length - 4) {
            if (imageBuffer[offset] === 0xFF && 
                (imageBuffer[offset + 1] === 0xE1 || imageBuffer[offset + 1] === 0xE0)) {
                
                const segmentLength = imageBuffer.readUInt16BE(offset + 2);
                const segmentData = imageBuffer.slice(offset + 4, offset + 4 + segmentLength);
                
                // Parse EXIF segment
                return parseExifSegment(segmentData);
            }
            offset++;
        }
        
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Parse EXIF segment data
 */
function parseExifSegment(data) {
    // Simplified EXIF parser
    const exif = { '0th': {}, 'GPS': {} };
    
    // Check for EXIF header
    const header = data.slice(0, 6).toString('ascii');
    if (header !== 'Exif\x00\x00') {
        return null;
    }
    
    const tiffOffset = 6;
    const byteOrder = data[tiffOffset] === 0x49 ? 'LE' : 'BE'; // II = LE, MM = BE
    
    // Read IFD0 (Image File Directory 0)
    const ifd0Offset = data.readUInt32LE(tiffOffset + 4);
    
    // Parse IFD0 entries
    const numEntries = byteOrder === 'LE' 
        ? data.readUInt16LE(tiff0Offset + tiffOffset)
        : data.readUInt16BE(ifd0Offset + tiffOffset);
    
    for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifd0Offset + tiffOffset + 2 + (i * 12);
        const tag = byteOrder === 'LE'
            ? data.readUInt16LE(entryOffset)
            : data.readUInt16BE(entryOffset);
        
        const valueOffset = entryOffset + 8;
        let value;
        
        // Read value based on tag
        if (tag === 0x010F || tag === 0x0110 || tag === 0x0131 || tag === 0x0132) {
            // ASCII strings (Make, Model, Software, DateTime)
            const valuePtr = byteOrder === 'LE'
                ? data.readUInt32LE(valueOffset)
                : data.readUInt32BE(valueOffset);
            const length = byteOrder === 'LE'
                ? data.readUInt32LE(entryOffset + 4)
                : data.readUInt32BE(entryOffset + 4);
            value = data.slice(tiffOffset + valuePtr, tiffOffset + valuePtr + length - 1).toString('ascii');
        } else if (tag === 0x8825) {
            // GPS IFD pointer
            const gpsOffset = byteOrder === 'LE'
                ? data.readUInt32LE(valueOffset)
                : data.readUInt32BE(valueOffset);
            exif.GPS = parseGPSData(data, tiffOffset + gpsOffset, byteOrder);
        }
        
        if (value) {
            exif['0th'][tag] = value;
        }
    }
    
    return exif;
}

/**
 * Parse GPS data from EXIF
 */
function parseGPSData(data, offset, byteOrder) {
    const gps = {};
    const numEntries = byteOrder === 'LE'
        ? data.readUInt16LE(offset)
        : data.readUInt16BE(offset);
    
    for (let i = 0; i < numEntries; i++) {
        const entryOffset = offset + 2 + (i * 12);
        const tag = byteOrder === 'LE'
            ? data.readUInt16LE(entryOffset)
            : data.readUInt16BE(entryOffset);
        
        // GPSLatitude (0x0002), GPSLongitude (0x0004), GPSAltitude (0x0006)
        if (tag === 0x0002 || tag === 0x0004 || tag === 0x0006) {
            const numComponents = byteOrder === 'LE'
                ? data.readUInt32LE(entryOffset + 4)
                : data.readUInt32BE(entryOffset + 4);
            const valuePtr = byteOrder === 'LE'
                ? data.readUInt32LE(entryOffset + 8)
                : data.readUInt32BE(entryOffset + 8);
            
            const values = [];
            for (let j = 0; j < numComponents; j++) {
                const num = byteOrder === 'LE'
                    ? data.readUInt32LE(valuePtr + j * 8)
                    : data.readUInt32BE(valuePtr + j * 8);
                const den = byteOrder === 'LE'
                    ? data.readUInt32LE(valuePtr + j * 8 + 4)
                    : data.readUInt32BE(valuePtr + j * 8 + 4);
                values.push([num, den]);
            }
            
            if (tag === 0x0002) gps.GPSLatitude = values;
            if (tag === 0x0004) gps.GPSLongitude = values;
            if (tag === 0x0006) gps.GPSAltitude = values;
        }
    }
    
    return gps;
}

/**
 * Extract encrypted data from EXIF structure
 */
function extractEncryptedDataFromExif(exifData) {
    // Try to reconstruct encrypted data from EXIF fields
    const parts = [];
    
    const ifd0 = exifData['0th'] || {};
    if (ifd0[0x0110]) parts.push(ifd0[0x0110]); // Model
    if (ifd0[0x0131]) parts.push(ifd0[0x0131]); // Software
    
    if (parts.length > 0) {
        // Combine parts and decode from base64
        try {
            return Buffer.from(parts.join(''), 'base64');
        } catch (e) {
            return null;
        }
    }
    
    return null;
}

/**
 * Process covert data from image upload
 */
async function processCovertData(covertData, metadata) {
    const { timestamp, payload } = covertData;
    
    const auditEntry = {
        timestamp: new Date(timestamp).toISOString(),
        source: 'media_upload',
        event_type: payload.type,
        session_id: payload.sessionId || metadata?.sessionId,
        data: payload.data,
        image_metadata: {
            original_filename: metadata?.filename,
            content_type: metadata?.contentType
        },
        processed_at: new Date().toISOString()
    };
    
    console.log('COVERT_MEDIA:', JSON.stringify(auditEntry));
    
    // Route to appropriate handler
    switch (payload.type) {
        case 0x01: // USER_REGISTER
            console.log('MEDIA_EVENT: User registered', payload.data);
            break;
        case 0x04: // CONVERSION
            console.log('MEDIA_EVENT: Conversion', payload.data);
            break;
        default:
            console.log('MEDIA_EVENT: Type', payload.type, payload.data);
    }
}

/**
 * Process image (resize, optimize)
 */
async function processImage(imageBuffer, metadata) {
    // In production: resize, compress, generate thumbnails
    // For now: return metadata about the image
    return {
        original_size: imageBuffer.length,
        format: detectImageFormat(imageBuffer),
        dimensions: await detectDimensions(imageBuffer)
    };
}

function detectImageFormat(buffer) {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
    if (buffer[0] === 0x89 && buffer.slice(1, 4).toString() === 'PNG') return 'png';
    if (buffer.slice(0, 6).toString() === 'GIF87a' || buffer.slice(0, 6).toString() === 'GIF89a') return 'gif';
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'webp';
    return 'unknown';
}

async function detectDimensions(buffer) {
    // Simplified dimension detection
    const format = detectImageFormat(buffer);
    if (format === 'jpeg') {
        // Find SOF0 marker (0xFFC0)
        for (let i = 0; i < buffer.length - 10; i++) {
            if (buffer[i] === 0xFF && (buffer[i+1] === 0xC0 || buffer[i+1] === 0xC2)) {
                return {
                    height: buffer.readUInt16BE(i + 5),
                    width: buffer.readUInt16BE(i + 7)
                };
            }
        }
    }
    return { width: 0, height: 0 };
}

/**
 * Create decoy upload response
 */
function createDecoyResponse(mediaId, processedImage, hasCovertData) {
    return {
        success: true,
        media_id: mediaId,
        upload_time: new Date().toISOString(),
        processed: processedImage ? {
            format: processedImage.format,
            dimensions: processedImage.dimensions,
            size_bytes: processedImage.original_size
        } : null,
        urls: {
            original: `/media/${mediaId}/original`,
            thumbnail: `/media/${mediaId}/thumb`
        },
        // Hidden acknowledgment
        _meta: hasCovertData ? { 
            status: 'ok', 
            processing_time_ms: Date.now() 
        } : { status: 'default' }
    };
}

function generateMediaId() {
    return require('crypto').randomBytes(16).toString('hex');
}

function generateCovertAck(sessionId) {
    const hash = require('crypto').createHash('sha256')
        .update(String(sessionId))
        .digest('hex')
        .slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 32)}`;
}

function encodeProcessingHint(payload) {
    const encoded = Buffer.allocUnsafe(4);
    encoded.writeUInt32BE(payload.timestamp || Date.now(), 0);
    return encoded.toString('base64url');
}
