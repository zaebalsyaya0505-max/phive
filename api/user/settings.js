/**
 * Blind Admin Interface: User Settings
 * Security Engineer Implementation
 * 
 * Cover: User profile settings
 * Hidden: Admin control panel (triple-click hidden button)
 * Path: GET /user/settings
 */

const { CovertEncryption } = require('../../covert/lib/crypto');

const crypto = new CovertEncryption();

module.exports = async (req, res) => {
    const isAdmin = detectAdminAccess(req);
    const adminData = isAdmin ? await fetchAdminData() : null;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(generateBlindSettingsPage(isAdmin, adminData));
};

function detectAdminAccess(req) {
    const { view, advanced } = req.query;
    const cookies = parseCookies(req.headers.cookie);
    
    return view === 'hidden' || 
           advanced === 'true' || 
           cookies._admin_mode === '1' ||
           cookies._advanced === 'enabled';
}

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
    }, {});
}

async function fetchAdminData() {
    return {
        users: {
            total: 15432,
            new_today: 145,
            active: 892
        },
        system: {
            version: '2.1.4',
            last_deploy: '2024-01-15 14:30:00',
            db_size: '2.4 GB'
        },
        campaigns: [
            { id: 'camp_001', name: 'Summer Promo', budget: 50000, spent: 32450, remaining: 17550 },
            { id: 'camp_002', name: 'Launch Push', budget: 100000, spent: 89340, remaining: 10660 }
        ],
        alerts: [
            { level: 'info', message: 'High conversion rate detected', time: '10 min ago' },
            { level: 'warning', message: 'Campaign budget 80% depleted', time: '1 hour ago' }
        ]
    };
}

function generateBlindSettingsPage(isAdmin, data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Settings</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { color: #666; }
        
        .logo {
            width: 80px;
            height: 80px;
            background: #1a73e8;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 32px;
            cursor: pointer;
            user-select: none;
        }
        
        .settings-card {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .settings-card h2 {
            font-size: 18px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 14px;
        }
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .toggle-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }
        .toggle-group:last-child { border-bottom: none; }
        .toggle-info h4 { font-size: 14px; margin-bottom: 4px; }
        .toggle-info p { font-size: 12px; color: #666; }
        
        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
            background: #ddd;
            border-radius: 13px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .toggle-switch.active { background: #1a73e8; }
        .toggle-switch::after {
            content: '';
            position: absolute;
            width: 22px;
            height: 22px;
            background: #fff;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.3s;
        }
        .toggle-switch.active::after { transform: translateX(24px); }
        
        .save-btn {
            background: #1a73e8;
            color: #fff;
            border: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        .save-btn:hover { background: #1557b0; }
        
        /* Hidden admin panel */
        .admin-panel {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0f0f23;
            z-index: 10000;
            overflow: auto;
        }
        .admin-panel.active { display: block; }
        
        .admin-content {
            max-width: 1200px;
            margin: 40px auto;
            padding: 30px;
        }
        
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .admin-header h2 {
            color: #4CAF50;
            font-size: 24px;
        }
        .close-admin {
            background: #333;
            border: none;
            color: #fff;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .admin-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .admin-card {
            background: #1a1a3e;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #4CAF50;
        }
        .admin-card h4 {
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .admin-card .value {
            font-size: 28px;
            color: #fff;
            font-weight: 600;
        }
        .admin-card .sub {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .campaigns-table {
            width: 100%;
            background: #1a1a3e;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .campaigns-table th,
        .campaigns-table td {
            padding: 15px 20px;
            text-align: left;
            color: #ccc;
        }
        .campaigns-table th {
            background: #252550;
            font-size: 12px;
            text-transform: uppercase;
            color: #888;
        }
        .campaigns-table tr:hover td {
            background: #252550;
        }
        
        .alert-item {
            background: #1a1a3e;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #ffd700;
        }
        .alert-item.info { border-left-color: #2196F3; }
        .alert-item.warning { border-left-color: #ffd700; }
        .alert-item.error { border-left-color: #e94560; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo" id="logo">⚙</div>
            <h1>Account Settings</h1>
            <p>Manage your profile and preferences</p>
        </div>
        
        <div class="settings-card">
            <h2>Profile Information</h2>
            <div class="form-group">
                <label>Display Name</label>
                <input type="text" value="User Name" placeholder="Enter your name">
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" value="user@example.com" placeholder="Enter your email">
            </div>
        </div>
        
        <div class="settings-card">
            <h2>Preferences</h2>
            <div class="toggle-group">
                <div class="toggle-info">
                    <h4>Dark Mode</h4>
                    <p>Use dark theme throughout the app</p>
                </div>
                <div class="toggle-switch active" onclick="this.classList.toggle('active')"></div>
            </div>
            <div class="toggle-group">
                <div class="toggle-info">
                    <h4>Push Notifications</h4>
                    <p>Receive updates and alerts</p>
                </div>
                <div class="toggle-switch active" onclick="this.classList.toggle('active')"></div>
            </div>
            <div class="toggle-group">
                <div class="toggle-info">
                    <h4>Email Updates</h4>
                    <p>Get weekly summary emails</p>
                </div>
                <div class="toggle-switch" onclick="this.classList.toggle('active')"></div>
            </div>
        </div>
        
        <div class="settings-card">
            <h2>Advanced Settings</h2>
            <div class="form-group">
                <label>Language</label>
                <select>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                </select>
            </div>
            <div class="form-group">
                <label>Timezone</label>
                <select>
                    <option>UTC-8 (Pacific)</option>
                    <option>UTC-5 (Eastern)</option>
                    <option>UTC+0 (London)</option>
                    <option>UTC+1 (Berlin)</option>
                </select>
            </div>
        </div>
        
        <button class="save-btn">Save Changes</button>
    </div>
    
    <!-- Hidden Admin Panel -->
    <div class="admin-panel" id="adminPanel">
        <div class="admin-content">
            <div class="admin-header">
                <h2>System Administration</h2>
                <button class="close-admin" onclick="closeAdmin()">Close</button>
            </div>
            
            <div class="admin-grid">
                <div class="admin-card">
                    <h4>Total Users</h4>
                    <div class="value">${formatNumber(data?.users?.total || 0)}</div>
                    <div class="sub">+${data?.users?.new_today || 0} today</div>
                </div>
                <div class="admin-card" style="border-left-color: #2196F3;">
                    <h4>Active Now</h4>
                    <div class="value" style="color: #2196F3;">${formatNumber(data?.users?.active || 0)}</div>
                    <div class="sub">Current sessions</div>
                </div>
                <div class="admin-card" style="border-left-color: #ffd700;">
                    <h4>App Version</h4>
                    <div class="value" style="color: #ffd700;">${data?.system?.version || '2.1.4'}</div>
                    <div class="sub">Last deploy: ${data?.system?.last_deploy || '2024-01-15'}</div>
                </div>
            </div>
            
            <div class="campaigns-table">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Budget</th>
                            <th>Spent</th>
                            <th>Remaining</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateCampaignRows(data?.campaigns || [])}
                    </tbody>
                </table>
            </div>
            
            <h3 style="color: #fff; margin-bottom: 15px;">System Alerts</h3>
            ${generateAlerts(data?.alerts || [])}
        </div>
    </div>
    
    <script>
        // Triple-click logo to activate admin mode
        let logoClicks = 0;
        let clickTimer = null;
        
        document.getElementById('logo').addEventListener('click', function() {
            logoClicks++;
            clearTimeout(clickTimer);
            
            if (logoClicks >= 3) {
                activateAdminMode();
                logoClicks = 0;
            } else {
                clickTimer = setTimeout(() => {
                    logoClicks = 0;
                }, 1000);
            }
        });
        
        function activateAdminMode() {
            document.getElementById('adminPanel').classList.add('active');
            document.cookie = '_admin_mode=1; path=/';
            
            console.log('%c[Admin]', 'color: #4CAF50; font-weight: bold;', 'System administration mode activated');
            
            window._admin = {
                showUsers: () => console.log('Total users: ${data?.users?.total || 0}'),
                showCampaigns: () => console.table(${JSON.stringify(data?.campaigns || [])}),
                showAlerts: () => console.table(${JSON.stringify(data?.alerts || [])}),
                help: () => console.log('Commands: showUsers, showCampaigns, showAlerts')
            };
        }
        
        function closeAdmin() {
            document.getElementById('adminPanel').classList.remove('active');
        }
        
        // Query param activation
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'hidden' || params.get('advanced') === 'true') {
            activateAdminMode();
            window.history.replaceState({}, '', '/user/settings');
        }
    </script>
</body>
</html>`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function generateCampaignRows(campaigns) {
    if (!campaigns || campaigns.length === 0) {
        return '<tr><td colspan="5" style="text-align: center; padding: 20px;">No active campaigns</td></tr>';
    }
    
    return campaigns.map(c => {
        const percent = (c.spent / c.budget * 100).toFixed(1);
        const status = percent > 80 ? 'warning' : 'active';
        const statusColor = status === 'warning' ? '#ffd700' : '#4CAF50';
        
        return `
            <tr>
                <td>${c.name}</td>
                <td>$${formatNumber(c.budget)}</td>
                <td>$${formatNumber(c.spent)} (${percent}%)</td>
                <td>$${formatNumber(c.remaining)}</td>
                <td style="color: ${statusColor};">${status.toUpperCase()}</td>
            </tr>
        `;
    }).join('');
}

function generateAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
        return '<div class="alert-item info">No active alerts</div>';
    }
    
    return alerts.map(a => `
        <div class="alert-item ${a.level}">
            <strong style="color: #${a.level === 'info' ? '2196F3' : a.level === 'warning' ? 'ffd700' : 'e94560'};">
                [${a.level.toUpperCase()}]
            </strong>
            ${a.message} - ${a.time}
        </div>
    `).join('');
}
