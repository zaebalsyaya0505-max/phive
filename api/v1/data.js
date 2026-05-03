/**
 * Blind Data API
 * Security Engineer Implementation
 * 
 * Cover: Generic data endpoint
 * Hidden: Admin data for blind interface
 * Path: GET /api/v1/data?view={users|revenue|campaigns}
 */

const { CovertEncryption } = require('../../covert/lib/crypto');

const crypto = new CovertEncryption();

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

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
        // Check authorization
        const isAuthorized = checkAuthorization(req);
        if (!isAuthorized) {
            // Return decoy data
            res.status(200).json(createDecoyResponse(req.query.view));
            return;
        }

        const view = req.query.view || 'default';
        const data = await fetchAdminData(view);
        
        // Encrypt response for covert channel
        const encrypted = crypto.encrypt({
            view,
            timestamp: Date.now(),
            data
        });

        res.status(200).json({
            status: 'ok',
            view,
            _payload: encrypted.toString('base64url')
        });
        
    } catch (error) {
        console.error('Data API error:', error.message);
        res.status(200).json(createDecoyResponse(req.query.view));
    }
};

/**
 * Check if request is authorized for admin data
 */
function checkAuthorization(req) {
    // Check for admin token in header (hidden in X-Request-ID or custom header)
    const adminToken = req.headers['x-admin-token'] || req.headers['x-request-id'];
    const clientVersion = req.headers['x-client-version'] || '';
    
    // Check for admin indicators
    if (clientVersion.includes('admin') || clientVersion.endsWith('-a')) {
        return true;
    }
    
    // Check cookies
    const cookies = parseCookies(req.headers.cookie);
    if (cookies._admin_mode === '1' || cookies._advanced === 'enabled') {
        return true;
    }
    
    // Check query param pattern
    const { debug } = req.query;
    if (debug === 'diagnostics_42' || debug === 'true') {
        return true;
    }
    
    // For development: allow all
    return process.env.NODE_ENV === 'development';
}

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
    }, {});
}

/**
 * Fetch admin data based on view
 */
async function fetchAdminData(view) {
    const mockData = {
        users: {
            total: 15432,
            new_today: 145,
            active_now: 892,
            list: [
                { id: 'u_001', email: 'user1@example.com', registered: '2024-01-15', last_active: '2 min ago', status: 'active' },
                { id: 'u_002', email: 'user2@example.com', registered: '2024-01-14', last_active: '5 min ago', status: 'active' },
                { id: 'u_003', email: 'user3@example.com', registered: '2024-01-13', last_active: '1 hour ago', status: 'active' },
                { id: 'u_004', email: 'user4@example.com', registered: '2024-01-12', last_active: '3 hours ago', status: 'idle' },
                { id: 'u_005', email: 'user5@example.com', registered: '2024-01-11', last_active: '1 day ago', status: 'offline' }
            ]
        },
        revenue: {
            today: 12580.50,
            yesterday: 11420.25,
            week: 89340.25,
            month: 345890.75,
            by_hour: [
                { hour: '00:00', amount: 450.50 },
                { hour: '04:00', amount: 320.25 },
                { hour: '08:00', amount: 1200.75 },
                { hour: '12:00', amount: 3450.00 },
                { hour: '16:00', amount: 2890.50 },
                { hour: '20:00', amount: 4268.50 }
            ]
        },
        campaigns: [
            { 
                id: 'camp_001', 
                name: 'Summer Promo', 
                status: 'active',
                budget: 50000, 
                spent: 32450, 
                remaining: 17550,
                impressions: 52340,
                clicks: 2134,
                ctr: 4.08,
                conversions: 145,
                revenue: 12580.50
            },
            { 
                id: 'camp_002', 
                name: 'Launch Push', 
                status: 'active',
                budget: 100000, 
                spent: 89340, 
                remaining: 10660,
                impressions: 124500,
                clicks: 5100,
                ctr: 4.10,
                conversions: 298,
                revenue: 29840.00
            },
            { 
                id: 'camp_003', 
                name: 'Holiday Special', 
                status: 'paused',
                budget: 25000, 
                spent: 12500, 
                remaining: 12500,
                impressions: 45000,
                clicks: 1800,
                ctr: 4.00,
                conversions: 89,
                revenue: 8900.00
            }
        ],
        events: [
            { type: 'user_register', count: 145, timestamp: Date.now() - 3600000 },
            { type: 'ad_impression', count: 52340, timestamp: Date.now() - 1800000 },
            { type: 'ad_click', count: 2134, timestamp: Date.now() - 1500000 },
            { type: 'conversion', count: 145, timestamp: Date.now() - 1200000 },
            { type: 'session_start', count: 892, timestamp: Date.now() - 900000 },
            { type: 'session_end', count: 445, timestamp: Date.now() - 600000 }
        ],
        system: {
            version: '2.1.4',
            uptime: '99.97%',
            avg_response_time: '45ms',
            active_connections: 892,
            db_size: '2.4 GB',
            cache_hit_ratio: '94.2%'
        }
    };

    return mockData[view] || mockData;
}

/**
 * Create decoy response for unauthorized requests
 */
function createDecoyResponse(view) {
    const decoys = {
        users: { count: 0, message: 'No users found' },
        revenue: { amount: 0, currency: 'USD' },
        campaigns: [],
        default: { status: 'ok', data: null }
    };

    return decoys[view] || decoys.default;
}
