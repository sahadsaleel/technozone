const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/summary', auth, reportController.getSummary);
// Mapping dashboard endpoint to the same controller for simplicity
router.get('/dashboard', auth, reportController.getSummary);
router.get('/excel', auth, reportController.downloadReport);

module.exports = router;
