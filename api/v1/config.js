/**
 * Blind Route: App Configuration
 * Security Engineer Implementation
 * 
 * Cover: App configuration endpoint
 * Hidden: Key exchange + raw data stream for authorized clients
 * Path: GET /api/v1/config
 */

const { CovertEncryption } = require('../../covert/lib/crypto');
const { HeaderSteganography } = require('../../covert/lib/steganography');

const crypto = new CovertEncryption();
const sessionStore = new Map(); // In production: use Redis

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Version, X-Request-ID');
    res.setHeader('Access-Control-Expose-Headers', 'ETag, X-Session-Params');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }

    try {
        // Check for admin authorization
        const isAdminRequest = detectAdminRequest(req);
        
        // Extract client public key from headers (if present)
        const clientPublicKey = extractClientKey(req);
        
        let response;
        let sessionData = null;
        
        if (isAdminRequest && clientPublicKey) {
            // Establish secure session
            sessionData = establishSession(clientPublicKey);
            
            // Build admin response with hidden data
            response = buildAdminResponse(sessionData);
            
            // Set ETag with embedded server public key
            res.setHeader('ETag', generateCovertETag(sessionData.serverPublicKey, sessionData.sessionId));
            res.setHeader('X-Session-Params', encodeSessionParams(sessionData));
        } else {
            // Return normal app config
            response = buildDecoyResponse();
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Config error:', error.message);
        res.status(200).json(buildDecoyResponse());
    }
};

/**
 * Detect if this is an admin request
 */
function detectAdminRequest(req) {
    // Check for admin token in X-Client-Version header
    const clientVersion = req.headers['x-client-version'] || '';
    if (clientVersion.includes('admin') || clientVersion.endsWith('-a')) {
        return true;
    }
    
    // Check for key fragments in X-Request-ID
    const requestId = req.headers['x-request-id'] || '';
    if (requestId.length === 36 && requestId.includes('-')) {
        // Valid UUID format - might contain key fragments
        return true;
    }
    
    // Check for specific query param pattern
    const view = req.query?.view;
    if (view === 'full' || view === 'advanced') {
        return true;
    }
    
    return false;
}

/**
 * Extract client public key from request headers
 */
function extractClientKey(req) {
    const requestId = req.headers['x-request-id'];
    if (!requestId) return null;
    
    // Try to extract key from UUID structure
    const clean = requestId.replace(/-/g, '');
    if (clean.length === 32) {
        // First fragment of a 64-char uncompressed key
        return Buffer.from(clean, 'hex');
    }
    
    // Try Accept-Language encoding
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
        const data = HeaderSteganography.decode({ 'accept-language': acceptLang });
        if (data && data.length >= 32) {
            return data.slice(0, 32);
        }
    }
    
    return null;
}

/**
 * Establish ECDH session
 */
function establishSession(clientPublicKey) {
    // Generate server ephemeral keypair
    const serverKeys = crypto.generateSessionKeys();
    
    // Derive shared secret
    const sharedSecret = crypto.deriveSharedSecret(serverKeys.privateKey, clientPublicKey);
    
    // Derive session keys
    const sessionId = require('crypto').randomBytes(8).toString('hex');
    const encryptionKey = crypto.hkdf(sharedSecret, 'covert-v1', 'encryption', 32);
    const authKey = crypto.hkdf(sharedSecret, 'covert-v1', 'authentication', 32);
    const nonceSeed = crypto.hkdf(sharedSecret, 'covert-v1', 'nonces', 12);
    
    // Store session
    const sessionData = {
        sessionId,
        serverPublicKey: serverKeys.publicKey,
        clientPublicKey,
        encryptionKey,
        authKey,
        nonceSeed,
        createdAt: Date.now(),
        lastUsed: Date.now()
    };
    
    sessionStore.set(sessionId, sessionData);
    
    // Schedule cleanup
    setTimeout(() => {
        sessionStore.delete(sessionId);
    }, 86400000); // 24 hours
    
    return sessionData;
}

/**
 * Build admin response with hidden data
 */
function buildAdminResponse(sessionData) {
    // Fetch latest admin data
    const adminData = fetchAdminData();
    
    // Encrypt data with session key
    const encryptedPayload = crypto.encrypt({
        sessionId: sessionData.sessionId,
        timestamp: Date.now(),
        data: adminData
    });
    
    return {
        // Decoy config values
        api_endpoints: {
            sync: '/api/v1/sync/preferences',
            analytics: '/api/v1/analytics/batch',
            media: '/api/v1/media/upload'
        },
        feature_flags: {
            dark_mode: true,
            push_notifications: true,
            offline_mode: true
        },
        sync_interval: 300,
        cache_ttl: 3600,
        
        // Hidden encrypted data
        _config: encryptedPayload.toString('base64url'),
        
        // Session hint
        session_id_fragment: sessionData.sessionId.slice(0, 4)
    };
}

/**
 * Build decoy response for normal clients
 */
function buildDecoyResponse() {
    return {
        api_endpoints: {
            sync: '/api/v1/sync/preferences',
            analytics: '/api/v1/analytics/batch',
            media: '/api/v1/media/upload'
        },
        feature_flags: {
            dark_mode: true,
            push_notifications: true,
            offline_mode: true
        },
        sync_interval: 300,
        cache_ttl: 3600,
        app_version: {
            min_supported: '1.0.0',
            latest: '2.1.0',
            update_required: false
        }
    };
}

/**
 * Fetch admin data (mock implementation)
 */
function fetchAdminData() {
    return {
        users: {
            total: 15432,
            new_today: 145,
            active_now: 892
        },
        revenue: {
            today: 12580.50,
            week: 89340.25,
            month: 345890.75
        },
        campaigns: [
            { id: 'camp_001', name: 'Summer Promo', impressions: 50000, clicks: 1250, ctr: 2.5 },
            { id: 'camp_002', name: 'Launch Push', impressions: 120000, clicks: 4800, ctr: 4.0 }
        ],
        events: [
            { type: 'user_register', count: 145, timestamp: Date.now() - 3600000 },
            { type: 'conversion', count: 23, timestamp: Date.now() - 1800000 }
        ]
    };
}

/**
 * Generate ETag with embedded server public key
 */
function generateCovertETag(serverPublicKey, sessionId) {
    // Format: hex-encoded public key + session ID + checksum
    const keyHex = Buffer.isBuffer(serverPublicKey) 
        ? serverPublicKey.toString('hex') 
        : serverPublicKey;
    const sessionHex = sessionId;
    const checksum = require('crypto')
        .createHash('sha256')
        .update(keyHex + sessionHex)
        .digest('hex')
        .slice(0, 8);
    
    // Standard ETag format with quotes
    return `"${keyHex}${sessionHex}${checksum}"`;
}

/**
 * Encode session parameters for client
 */
function encodeSessionParams(sessionData) {
    const params = {
        sid: sessionData.sessionId,
        exp: 86400, // 24 hours in seconds
        algo: 'aes-256-gcm'
    };
    return Buffer.from(JSON.stringify(params)).toString('base64url');
}
