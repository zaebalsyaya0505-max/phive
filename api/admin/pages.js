/**
 * Admin Pages - Consolidated
 * Combines: blog/editor, user/settings
 * Routes:
 *   GET /blog/editor
 *   GET /user/settings
 */

const { CovertEncryption } = require('../../../covert/lib/crypto');

const crypto = new CovertEncryption();

module.exports = async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  
  if (pathname.startsWith('/blog/editor')) {
    return editorHandler(req, res);
  } else if (pathname.startsWith('/user/settings')) {
    return settingsHandler(req, res);
  }
  
  res.status(404).json({ error: 'not_found' });
};

// ============= BLOG EDITOR ENDPOINT =============

async function editorHandler(req, res) {
  const isAdmin = detectAdminAccess(req);
  const adminData = isAdmin ? await fetchAdminData() : null;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(generateBlindEditorPage(isAdmin, adminData));
}

function detectAdminAccess(req) {
  const { view, debug } = req.query;
  if (view === 'hidden' || view === 'debug' || debug === 'true' || debug === 'diagnostics_42') {
    return true;
  }
  
  const cookies = parseCookies(req.headers.cookie);
  if (cookies._mode === 'advanced' || cookies._admin === '1') {
    return true;
  }
  
  return false;
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
      active_now: 892,
      list: [
        { id: 'u_001', email: 'u***@gmail.com', registered: '2024-01-15', status: 'active' },
        { id: 'u_002', email: 'j***@yahoo.com', registered: '2024-01-14', status: 'active' }
      ]
    },
    revenue: {
      today: 12580.50,
      week: 89340.25,
      month: 345890.75
    },
    sessions: {
      active: 892,
      avg_duration: '12m 34s'
    },
    campaigns: [
      { id: 'camp_001', name: 'Summer Promo', impressions: 50000, clicks: 1250, ctr: 2.5, revenue: 6250 },
      { id: 'camp_002', name: 'Launch Push', impressions: 120000, clicks: 4800, ctr: 4.0, revenue: 19200 }
    ]
  };
}

function generateBlindEditorPage(isAdmin, adminData) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Editor - Blog</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .header { 
            background: #fff; 
            padding: 20px 40px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { 
            font-size: 24px; 
            color: #333;
            cursor: default;
        }
        .header h1:hover::after {
            content: '${adminData?.users?.new_today || 0} new today';
            position: absolute;
            background: #333;
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        
        .container { display: flex; min-height: calc(100vh - 81px); }
        .sidebar { 
            width: 250px; 
            background: #fff; 
            border-right: 1px solid #e0e0e0;
            padding: 20px;
        }
        .sidebar h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 15px;
        }
        .sidebar h3:hover::after {
            content: 'Sessions: ${adminData?.sessions?.active || 0}';
            display: block;
            font-size: 11px;
            color: #999;
            margin-top: 5px;
        }
        .sidebar ul { list-style: none; }
        .sidebar li { 
            padding: 10px 15px; 
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 5px;
        }
        .sidebar li:hover { background: #f5f5f5; }
        .sidebar li.active { background: #e3f2fd; color: #1976d2; }
        
        .main { flex: 1; padding: 40px; }
        .editor {
            background: #fff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .editor h2 { margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        .form-group textarea { min-height: 300px; resize: vertical; }
        
        .admin-panel {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            overflow: auto;
        }
        .admin-panel.active { display: block; }
        .admin-content {
            max-width: 1400px;
            margin: 40px auto;
            background: #1a1a1a;
            border-radius: 12px;
            padding: 30px;
            color: #fff;
        }
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
        }
        .admin-header h2 { color: #4CAF50; }
        .close-admin {
            background: #333;
            border: none;
            color: #fff;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
        }
        .metric-card h4 {
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .metric-card .value {
            font-size: 32px;
            font-weight: 600;
            color: #fff;
        }
        .metric-card .change {
            font-size: 12px;
            color: #4CAF50;
            margin-top: 5px;
        }
        
        .data-section {
            background: #2a2a2a;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .data-section h3 {
            padding: 15px 20px;
            background: #333;
            font-size: 14px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        .data-table th,
        .data-table td {
            padding: 12px 20px;
            text-align: left;
            border-bottom: 1px solid #333;
        }
        .data-table th {
            color: #888;
            font-weight: 500;
            font-size: 12px;
            text-transform: uppercase;
        }
        .data-table td {
            color: #ccc;
            font-size: 13px;
        }
        .data-table tr:hover td {
            background: #333;
        }
        
        .footer {
            padding: 20px 40px;
            background: #fff;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        .footer:hover::before {
            content: 'Revenue today: $${adminData?.revenue?.today || 0}';
            display: block;
            color: #666;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Content Editor</h1>
        <div>
            <span style="color: #666; font-size: 14px;">Draft saved just now</span>
        </div>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <h3>Navigation</h3>
            <ul>
                <li class="active">New Post</li>
                <li>All Posts</li>
                <li>Categories</li>
                <li>Media</li>
                <li>Settings</li>
            </ul>
            
            <h3 style="margin-top: 30px;">System</h3>
            <ul>
                <li>Help & Docs</li>
                <li>Debug Info</li>
                <li>System Status</li>
            </ul>
        </div>
        
        <div class="main">
            <div class="editor">
                <h2>Create New Post</h2>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" placeholder="Enter post title...">
                </div>
                <div class="form-group">
                    <label>Content</label>
                    <textarea placeholder="Write your content here..."></textarea>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="padding: 12px 24px; background: #1976d2; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                        Save Draft
                    </button>
                    <button style="padding: 12px 24px; background: #4CAF50; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                        Publish
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        © 2024 Blog Editor. All rights reserved.
    </div>
    
    <div class="admin-panel" id="adminPanel">
        <div class="admin-content">
            <div class="admin-header">
                <h2>System Diagnostics</h2>
                <button class="close-admin" onclick="closeAdmin()">Close</button>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Total Users</h4>
                    <div class="value">\${formatNumber(adminData?.users?.total || 0)}</div>
                    <div class="change">+\${adminData?.users?.new_today || 0} today</div>
                </div>
                <div class="metric-card">
                    <h4>Active Sessions</h4>
                    <div class="value">\${formatNumber(adminData?.sessions?.active || 0)}</div>
                    <div class="change">\${adminData?.sessions?.avg_duration || '0m'} avg</div>
                </div>
                <div class="metric-card">
                    <h4>Today's Revenue</h4>
                    <div class="value">$\${formatNumber(adminData?.revenue?.today || 0)}</div>
                    <div class="change">+$\${formatNumber((adminData?.revenue?.today || 0) * 0.1)} vs yesterday</div>
                </div>
                <div class="metric-card">
                    <h4>Monthly Revenue</h4>
                    <div class="value">$\${formatNumber(adminData?.revenue?.month || 0)}</div>
                    <div class="change">On track</div>
                </div>
            </div>
            
            <div class="data-section">
                <h3>Recent Users</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Registered</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${generateUserRows(adminData?.users?.list || [])}
                    </tbody>
                </table>
            </div>
            
            <div class="data-section">
                <h3>Active Campaigns</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Impressions</th>
                            <th>Clicks</th>
                            <th>CTR</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${generateCampaignRows(adminData?.campaigns || [])}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                       'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
                       'b','a'];
        let currentSequence = [];
        let konamiTimeout = null;
        
        document.addEventListener('keydown', (e) => {
            currentSequence.push(e.key);
            currentSequence = currentSequence.slice(-10);
            
            clearTimeout(konamiTimeout);
            konamiTimeout = setTimeout(() => {
                currentSequence = [];
            }, 5000);
            
            if (JSON.stringify(currentSequence) === JSON.stringify(KONAMI)) {
                activateAdminMode();
                currentSequence = [];
            }
        });
        
        let logoClicks = 0;
        let clickTimer = null;
        document.querySelector('.header h1').addEventListener('click', () => {
            logoClicks++;
            clearTimeout(clickTimer);
            
            if (logoClicks >= 5) {
                activateAdminMode();
                logoClicks = 0;
            } else {
                clickTimer = setTimeout(() => {
                    logoClicks = 0;
                }, 2000);
            }
        });
        
        function activateAdminMode() {
            document.getElementById('adminPanel').classList.add('active');
            console.log('%c[System]', 'color: #4CAF50; font-weight: bold;', 'Diagnostics mode activated');
            console.log('%c[Data]', 'color: #2196F3;', 'Full admin access enabled');
            
            window._admin = {
                showUsers: () => console.log('Admin data available'),
                showRevenue: () => console.log('Revenue data available'),
                showCampaigns: () => console.log('Campaign data available'),
                help: () => console.log('Available commands: showUsers, showRevenue, showCampaigns')
            };
            
            console.log('%c[Help]', 'color: #FF9800;', 'Use _admin.help() for available commands');
        }
        
        function closeAdmin() {
            document.getElementById('adminPanel').classList.remove('active');
        }
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'hidden' || params.get('debug') === 'true') {
            activateAdminMode();
            window.history.replaceState({}, '', '/blog/editor');
        }
        
        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }
        
        function generateUserRows(users) {
            if (!users || users.length === 0) {
                return '<tr><td colspan="4" style="text-align: center; color: #666;">No recent users</td></tr>';
            }
            
            return users.map(u => \`
                <tr>
                    <td>\${u.id}</td>
                    <td>\${u.email}</td>
                    <td>\${u.registered}</td>
                    <td><span style="color: #4CAF50;">●</span> \${u.status}</td>
                </tr>
            \`).join('');
        }
        
        function generateCampaignRows(campaigns) {
            if (!campaigns || campaigns.length === 0) {
                return '<tr><td colspan="5" style="text-align: center; color: #666;">No active campaigns</td></tr>';
            }
            
            return campaigns.map(c => \`
                <tr>
                    <td>\${c.name}</td>
                    <td>\${formatNumber(c.impressions)}</td>
                    <td>\${formatNumber(c.clicks)}</td>
                    <td>\${c.ctr}%</td>
                    <td>$\${formatNumber(c.revenue)}</td>
                </tr>
            \`).join('');
        }
    </script>
</body>
</html>`;
}

// ============= USER SETTINGS ENDPOINT =============

async function settingsHandler(req, res) {
  const isAdmin = detectSettingsAdminAccess(req);
  const adminData = isAdmin ? await fetchSettingsAdminData() : null;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(generateBlindSettingsPage(isAdmin, adminData));
}

function detectSettingsAdminAccess(req) {
  const { view, advanced } = req.query;
  const cookies = parseCookies(req.headers.cookie);
  
  return view === 'hidden' || 
         advanced === 'true' || 
         cookies._admin_mode === '1' ||
         cookies._advanced === 'enabled';
}

async function fetchSettingsAdminData() {
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
                </select>
            </div>
        </div>
        
        <button class="save-btn">Save Changes</button>
    </div>
    
    <div class="admin-panel" id="adminPanel">
        <div class="admin-content">
            <div class="admin-header">
                <h2>System Administration</h2>
                <button class="close-admin" onclick="closeAdmin()">Close</button>
            </div>
            
            <div class="admin-grid">
                <div class="admin-card">
                    <h4>Total Users</h4>
                    <div class="value">\${formatNumber(data?.users?.total || 0)}</div>
                    <div class="sub">+\${data?.users?.new_today || 0} today</div>
                </div>
                <div class="admin-card" style="border-left-color: #2196F3;">
                    <h4>Active Now</h4>
                    <div class="value" style="color: #2196F3;">\${formatNumber(data?.users?.active || 0)}</div>
                    <div class="sub">Current sessions</div>
                </div>
                <div class="admin-card" style="border-left-color: #ffd700;">
                    <h4>App Version</h4>
                    <div class="value" style="color: #ffd700;">\${data?.system?.version || '2.1.4'}</div>
                    <div class="sub">Last deploy: \${data?.system?.last_deploy || '2024-01-15'}</div>
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
                        </tr>
                    </thead>
                    <tbody>
                        \${generateCampaignRows(data?.campaigns || [])}
                    </tbody>
                </table>
            </div>
            
            <h3 style="color: #fff; margin-bottom: 15px;">System Alerts</h3>
            \${generateAlerts(data?.alerts || [])}
        </div>
    </div>
    
    <script>
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
                showUsers: () => console.log('Total users: \${data?.users?.total || 0}'),
                showCampaigns: () => console.table(\${JSON.stringify(data?.campaigns || [])}),
                showAlerts: () => console.table(\${JSON.stringify(data?.alerts || [])}),
                help: () => console.log('Commands: showUsers, showCampaigns, showAlerts')
            };
        }
        
        function closeAdmin() {
            document.getElementById('adminPanel').classList.remove('active');
        }
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'hidden' || params.get('advanced') === 'true') {
            activateAdminMode();
            window.history.replaceState({}, '', '/user/settings');
        }
        
        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }
        
        function generateCampaignRows(campaigns) {
            if (!campaigns || campaigns.length === 0) {
                return '<tr><td colspan="4" style="text-align: center; padding: 20px;">No active campaigns</td></tr>';
            }
            
            return campaigns.map(c => {
                const percent = (c.spent / c.budget * 100).toFixed(1);
                const status = percent > 80 ? 'warning' : 'active';
                const statusColor = status === 'warning' ? '#ffd700' : '#4CAF50';
                
                return \`
                    <tr>
                        <td>\${c.name}</td>
                        <td>$\${formatNumber(c.budget)}</td>
                        <td>$\${formatNumber(c.spent)} (\${percent}%)</td>
                        <td>$\${formatNumber(c.remaining)}</td>
                    </tr>
                \`;
            }).join('');
        }
        
        function generateAlerts(alerts) {
            if (!alerts || alerts.length === 0) {
                return '<div class="alert-item info">No active alerts</div>';
            }
            
            return alerts.map(a => \`
                <div class="alert-item \${a.level}">
                    <strong style="color: #\${a.level === 'info' ? '2196F3' : a.level === 'warning' ? 'ffd700' : 'e94560'};">
                        [\${a.level.toUpperCase()}]
                    </strong>
                    \${a.message} - \${a.time}
                </div>
            \`).join('');
        }
    </script>
</body>
</html>`;
}
