const ServiceSale = require('../models/ServiceSale');
const ServiceExpense = require('../models/ServiceExpense');

// @desc    Add a new service sale
// @route   POST /api/services/sales
// @access  Private
exports.addServiceSale = async (req, res) => {
    try {
        const { serviceName, customerName, charge, cost, paymentMethod, date } = req.body;

        const newServiceSale = new ServiceSale({
            serviceName,
            customerName,
            charge,
            cost,
            paymentMethod,
            date: date || Date.now()
        });

        const savedSale = await newServiceSale.save();
        res.status(201).json(savedSale);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a new service expense
// @route   POST /api/services/expenses
// @access  Private
exports.addServiceExpense = async (req, res) => {
    try {
        const { expenseType, amount, relatedService, date } = req.body;

        const newServiceExpense = new ServiceExpense({
            expenseType,
            amount,
            relatedService,
            date: date || Date.now()
        });

        const savedExpense = await newServiceExpense.save();
        res.status(201).json(savedExpense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all service sales
// @route   GET /api/services/sales
// @access  Private
exports.getServiceSales = async (req, res) => {
    try {
        const sales = await ServiceSale.find().sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all service expenses
// @route   GET /api/services/expenses
// @access  Private
exports.getServiceExpenses = async (req, res) => {
    try {
        const expenses = await ServiceExpense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
