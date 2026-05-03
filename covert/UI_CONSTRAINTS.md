# UI Constraints for Blind Admin Interface
## Security Requirements → UI Designer

---

## Hard Constraints (Non-Negotiable)

### 1. No "Admin" Terminology

**Forbidden terms in UI:**
- "admin", "administrator", "administration"
- "dashboard", "control panel", "management"
- "analytics", "tracking", "monitoring" (use "metrics", "stats" if needed)
- "user management" (use "profiles", "accounts")
- "ad tracking" (use "campaign data", "promotion stats")

**Allowed alternatives:**
- "Debug info", "Technical details", "System info"
- "User profiles", "Account list"
- "Campaign metrics", "Promotion analytics"
- "Settings", "Preferences"

### 2. No Explicit Login Forms

**No:**
- `/login` pages
- Username/password input fields
- "Sign in" buttons
- Authentication dialogs

**Instead:**
- Magic sequences (keyboard shortcuts)
- Hidden triggers (easter eggs)
- Query parameters with auto-redirect
- Existing session elevation

### 3. Hidden Data Display Patterns

#### Pattern A: Easter Egg Hover
```
Normal state:     "Welcome to the editor"
Hover on title:   Tooltip shows "New users today: 42"
```

#### Pattern B: Debug Overlay
```
Normal state:     Help page with troubleshooting steps
Debug enabled:    Additional "Technical details" section
                    - "System version: 1.2.3" (cover)
                    - "Active users: 1,234" (actual data)
```

#### Pattern C: Console API
```javascript
// No visible UI - data only in console
> _admin.showRevenue()
"Revenue today: $12,345"

> _admin.showUsers()
[{"id": "...", "registered": "2024-01-15"}, ...]
```

### 4. URL Structure Requirements

**No admin-specific paths:**
```
✗ /admin
✗ /dashboard
✗ /analytics
✗ /api/admin/*
✗ /management
```

**Use instead:**
```
✓ /blog/editor
✓ /help/troubleshooting
✓ /user/settings
✓ /api/v1/config
✓ / (homepage with console API)
```

### 5. Data Visualization Masking

**Instead of charts:**
```
✗ "Revenue chart"
✓ "System load visualization" (looks like performance monitor)

✗ "User growth graph"
✓ "Memory usage history" (looks like technical metric)
```

**Instead of tables:**
```
✗ "User table"
✓ "Debug log entries" (each row = user data)

✗ "Transaction list"
✓ "Network request log"
```

---

## Authentication Trigger Specifications

### Konami Code Pattern

**Implementation:**
```javascript
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                'b', 'a'];

let currentSequence = [];

document.addEventListener('keydown', (e) => {
    currentSequence.push(e.key);
    currentSequence = currentSequence.slice(-10);
    
    if (JSON.stringify(currentSequence) === JSON.stringify(KONAMI)) {
        activateAdminMode();
    }
});
```

**Timeout:** Reset sequence after 5 seconds of inactivity

### Hidden Button Pattern

**Implementation:**
```javascript
let logoClickCount = 0;
let clickTimer = null;

document.querySelector('.logo').addEventListener('click', () => {
    logoClickCount++;
    clearTimeout(clickTimer);
    
    if (logoClickCount >= 5) {
        activateAdminMode();
        logoClickCount = 0;
    } else {
        clickTimer = setTimeout(() => {
            logoClickCount = 0;
        }, 2000);
    }
});
```

### Query Parameter Pattern

**Implementation:**
```javascript
// URL: /help/troubleshooting?view=hidden
const params = new URLSearchParams(window.location.search);
if (params.get('view') === 'hidden') {
    activateAdminMode();
    // Clean URL to remove evidence
    window.history.replaceState({}, '', '/help/troubleshooting');
}
```

---

## Data Display Specifications

### Hover Easter Eggs

**Location map:**
```
┌─────────────────────────────────────┐
│ [Hover = new users today]           │ ← h1.title
│                                     │
│  ┌──────┐                          │
│  │Sidebar│ [Hover = active sessions]│ ← .sidebar
│  │      │                          │
│  │      │                          │
│  └──────┘                          │
│                                     │
│  [Hover = revenue]                  │ ← .footer
└─────────────────────────────────────┘
```

**Tooltip styling:**
- Same as browser default tooltip (no custom styling that stands out)
- Delay: 500ms (not immediate)
- Disappears on mouse leave

### Console API Schema

**Global namespace:** `_admin`

**Methods:**
```javascript
_admin.showUsers()        // Display user table in console
_admin.showRevenue()      // ASCII chart of revenue
_admin.showConversions()   // Conversion funnel data
_admin.showAds()          // Ad campaign performance
_admin.exportData()       // Download JSON dump
_admin.help()             // List all commands
```

**Implementation:**
```javascript
window._admin = {
    showUsers: () => {
        fetch('/api/v1/data?type=users', {
            headers: {'x-admin-token': deriveToken()}
        }).then(r => r.json()).then(data => {
            console.table(data.users);
        });
    },
    // ... other methods
};
```

---

## Responsive Design Constraints

### Mobile Considerations

**No Konami code on mobile** → Use:
- Shake gesture (accelerometer)
- Multi-touch pattern (3-finger tap)
- Pull-to-refresh with hold
- Volume button sequence

**Implementation:**
```javascript
// Shake detection
let lastAcceleration = {x: 0, y: 0, z: 0};
window.addEventListener('devicemotion', (e) => {
    const delta = Math.abs(e.acceleration.x - lastAcceleration.x) +
                   Math.abs(e.acceleration.y - lastAcceleration.y) +
                   Math.abs(e.acceleration.z - lastAcceleration.z);
    if (delta > 20) {
        shakeCount++;
        if (shakeCount >= 3) activateAdminMode();
    }
});
```

---

## Security Verification

### Penetration Test Requirements

**White-box test:**
- Source code reviewed: No "admin" strings found in UI code
- All authentication via side channels
- No explicit API endpoints with "admin" in path

**Black-box test:**
- External scanning: No `/admin`, `/dashboard` endpoints found
- Traffic analysis: Admin data indistinguishable from normal traffic
- UI inspection: No admin interface discoverable without triggers

---

## Deliverables for Implementation

1. **CSS:** Dark theme for "debug" mode (looks like terminal/diagnostics)
2. **JavaScript:** Event listeners for triggers, console API
3. **HTML:** Decoy pages with hidden data containers
4. **Assets:** Icons that look like debug/tech symbols

---

**Document ID:** UI-CONST-v1.0
**Author:** Security Engineer
**Delivered to:** UI Designer
