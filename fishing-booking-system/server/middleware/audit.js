const fs = require('fs');
const path = require('path');

const auditLog = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            user: req.user?.username || 'anonymous',
            role: req.user?.role || 'guest',
            status: res.statusCode,
            ip: req.ip
        };
        
        const logFile = path.join(__dirname, '..', 'data', 'audit.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = auditLog;