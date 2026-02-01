const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const purchaseController = require('../controllers/purchaseController');

router.get('/', auth, purchaseController.getPurchases);
router.post('/', auth, purchaseController.createPurchase);

module.exports = router;
