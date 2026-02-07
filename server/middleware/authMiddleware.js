const jwt = require('jsonwebtoken');

// Authentication middleware disabled as per user request
module.exports = function (req, res, next) {
    // Bypass all authentication checks
    next();
};
