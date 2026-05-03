const express = require('express');
const router = express.Router();

// Мок данных BypassEngine - в реальности это будет подключено к Android
let bypassStatus = {
    currentMethod: {
        id: "psiphon-v2",
        name: "Psiphon 2.0",
        priority: 1,
        networkType: "BOTH",
        requiresRoot: false
    },
    connectionState: "CONNECTED",
    isReady: true,
    lastUpdate: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 часа
    statistics: {
        successRate: 0.95,
        latencyMs: 150,
        stabilityScore: 0.88,
        uptime: "4h 32m"
    },
    availableMethods: [
        {
            id: "psiphon-v2",
            name: "Psiphon 2.0",
            priority: 1,
            requiresRoot: false,
            networkType: "BOTH",
            status: "ACTIVE"
        },
        {
            id: "lantern",
            name: "Lantern",
            priority: 2,
            requiresRoot: false,
            networkType: "WIFI",
            status: "AVAILABLE"
        },
        {
            id: "tor-obfs4",
            name: "Tor OBFS4",
            priority: 3,
            requiresRoot: false,
            networkType: "BOTH",
            status: "AVAILABLE"
        }
    ]
};

// GET /api/bypass-status - текущий статус
router.get('/', (req, res) => {
    res.json({
        ok: true,
        data: bypassStatus,
        timestamp: new Date().toISOString()
    });
});

// POST /api/bypass-status/force-update - принудительное обновление
router.post('/force-update', (req, res) => {
    // В реальности здесь будет вызов MethodUpdater.checkForUpdates()
    setTimeout(() => {
        bypassStatus.lastUpdate = new Date().toISOString();
        bypassStatus.nextUpdate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    }, 1000);
    
    res.json({
        ok: true,
        message: "Обновление запущено",
        estimatedTime: "30-60 секунд"
    });
});

// POST /api/bypass-status/switch-method - переключение метода
router.post('/switch-method', express.json(), (req, res) => {
    const { methodId } = req.body;
    
    const method = bypassStatus.availableMethods.find(m => m.id === methodId);
    if (!method) {
        return res.status(400).json({
            ok: false,
            error: "method_not_found"
        });
    }
    
    // В реальности здесь будет вызов BypassEngine.ensureConnection() с новым методом
    bypassStatus.currentMethod = { ...method, status: "ACTIVE" };
    bypassStatus.connectionState = "CONNECTING";
    
    setTimeout(() => {
        bypassStatus.connectionState = "CONNECTED";
        bypassStatus.isReady = true;
    }, 2000);
    
    res.json({
        ok: true,
        message: "Переключение метода запущено",
        targetMethod: method
    });
});

// GET /api/bypass-statistics - детальная статистика
router.get('/statistics', (req, res) => {
    res.json({
        ok: true,
        data: {
            current: bypassStatus.statistics,
            history: [
                { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), method: "psiphon-v2", successRate: 0.92, latencyMs: 180 },
                { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), method: "psiphon-v2", successRate: 0.94, latencyMs: 165 },
                { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), method: "psiphon-v2", successRate: 0.93, latencyMs: 155 },
                { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), method: "psiphon-v2", successRate: 0.95, latencyMs: 150 }
            ],
            uptime: {
                total: "4h 32m",
                currentSession: "1h 15m",
                lastFailure: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            }
        }
    });
});

module.exports = router;
