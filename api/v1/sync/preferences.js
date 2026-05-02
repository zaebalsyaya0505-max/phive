/**
 * Dead Drop: Sync Preferences
 * Security Engineer Implementation
 * 
 * Cover: User preference synchronization
 * Hidden: Admin data transmission via steganography
 * Path: POST /api/v1/sync/preferences
 */

const { CovertEncryption } = require('../../../covert/lib/crypto');
const { HeaderSteganography } = require('../../../covert/lib/steganography');

const crypto = new CovertEncryption();

module.exports = async (req, res) => {
    // CORS headers for mobile app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID, Accept-Language');

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
        // Extract covert data from request
        const covertData = await extractCovertData(req);
        
        if (covertData) {
            // Process admin data
            await processAdminData(covertData);
            
            // Return decoy response with hidden acknowledgment
            const response = createDecoyResponse(true);
            res.setHeader('X-Request-ID', generateCovertAck(covertData.sessionId));
            res.status(200).json(response);
        } else {
            // Return normal decoy response (no covert data detected)
            res.status(200).json(createDecoyResponse(false));
        }
    } catch (error) {
        // Log error but don't expose internal details
        console.error('Sync preferences error:', error.message);
        res.status(200).json(createDecoyResponse(false));
    }
};

/**
 * Extract covert data from request (headers + body steganography)
 */
async function extractCovertData(req) {
    const data = [];
    
    // Extract from headers
    const headerData = HeaderSteganography.decode(req.headers);
    if (headerData) {
        data.push(headerData);
    }
    
    // Extract from body if present
    if (req.body && req.body.prefs_data) {
        try {
            const bodyPayload = Buffer.from(req.body.prefs_data, 'base64');
            data.push(bodyPayload);
        } catch (e) {
            // Not valid base64, might be legitimate preference data
        }
    }
    
    if (data.length === 0) return null;
    
    // Combine and decrypt
    const combined = Buffer.concat(data);
    try {
        return crypto.decrypt(combined);
    } catch (e) {
        // Failed to decrypt - might be regular traffic
        return null;
    }
}

/**
 * Process extracted admin data
 */
async function processAdminData(covertData) {
    const { timestamp, payload } = covertData;
    
    // Store in covert audit log
    const auditEntry = {
        timestamp: new Date(timestamp).toISOString(),
        type: payload.type,
        source: payload.source || 'unknown',
        sessionId: payload.sessionId,
        data: payload.data,
        receivedAt: new Date().toISOString()
    };
    
    // Append to audit log (in production, use append-only storage)
    console.log('COVERT_AUDIT:', JSON.stringify(auditEntry));
    
    // Route to appropriate processor based on event type
    switch (payload.type) {
        case 0x01: // USER_REGISTER
            await handleUserRegister(payload.data);
            break;
        case 0x02: // AD_IMPRESSION
            await handleAdImpression(payload.data);
            break;
        case 0x03: // AD_CLICK
            await handleAdClick(payload.data);
            break;
        case 0x04: // CONVERSION
            await handleConversion(payload.data);
            break;
        case 0x05: // SESSION_START
        case 0x06: // SESSION_END
            await handleSessionEvent(payload.type, payload.data);
            break;
        case 0xFF: // HEARTBEAT
            await handleHeartbeat(payload.data);
            break;
        default:
            console.log('Unknown payload type:', payload.type);
    }
}

/**
 * Create decoy response that looks like legitimate preference sync
 */
function createDecoyResponse(acknowledged) {
    return {
        success: true,
        synced_at: Date.now(),
        preferences: {
            theme: 'system',
            notifications: true,
            auto_sync: true,
            language: 'en'
        },
        server_time: new Date().toISOString(),
        // Hidden acknowledgment in nested structure
        _meta: acknowledged ? { status: 'ok', hash: generateHash() } : { status: 'default' }
    };
}

/**
 * Generate covert acknowledgment in response header
 */
function generateCovertAck(sessionId) {
    // Encode session acknowledgment in UUID format
    const hash = require('crypto').createHash('sha256')
        .update(String(sessionId))
        .digest('hex')
        .slice(0, 32);
    
    // Format as UUID
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 32)}`;
}

function generateHash() {
    return require('crypto').randomBytes(8).toString('hex');
}

// Event handlers
async function handleUserRegister(data) {
    console.log('EVENT: User registered', { userId: data.userId, timestamp: data.timestamp });
}

async function handleAdImpression(data) {
    console.log('EVENT: Ad impression', { campaignId: data.campaignId, userId: data.userId });
}

async function handleAdClick(data) {
    console.log('EVENT: Ad click', { campaignId: data.campaignId, userId: data.userId });
}

async function handleConversion(data) {
    console.log('EVENT: Conversion', { value: data.value, userId: data.userId });
}

async function handleSessionEvent(type, data) {
    const event = type === 0x05 ? 'SESSION_START' : 'SESSION_END';
    console.log(`EVENT: ${event}`, { userId: data.userId, duration: data.duration });
}

async function handleHeartbeat(data) {
    // Heartbeat received - connection healthy
}
