const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const expenseController = require('../controllers/expenseController');

router.get('/', auth, expenseController.getExpenses);
router.post('/', auth, expenseController.createExpense);
router.put('/:id', auth, expenseController.updateExpense);
router.delete('/:id', auth, expenseController.deleteExpense);

module.exports = router;
