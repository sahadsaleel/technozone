const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Service Sales Routes
router.post('/sales', serviceController.addServiceSale);
router.get('/sales', serviceController.getServiceSales);

// Service Expenses Routes
router.post('/expenses', serviceController.addServiceExpense);
router.get('/expenses', serviceController.getServiceExpenses);

module.exports = router;
