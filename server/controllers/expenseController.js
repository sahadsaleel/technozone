const Expense = require('../models/Expense');

/**
 * @desc    Get expenses with optional filtering
 * @route   GET /api/expenses?view=daily|monthly
 * @access  Private
 */
exports.getExpenses = async (req, res) => {
    const { view } = req.query; // 'daily' or 'monthly'
    try {
        let filter = {};
        const now = new Date();

        if (view === 'daily') {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filter.date = { $gte: startOfDay };
        } else if (view === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filter.date = { $gte: startOfMonth };
        }

        const expenses = await Expense.find(filter).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Create a new expense
 * @route   POST /api/expenses
 * @access  Private
 */
exports.createExpense = async (req, res) => {
    const { type, amount, description, date } = req.body;
    try {
        const newExpense = new Expense({
            type,
            amount,
            description,
            date
        });
        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
exports.updateExpense = async (req, res) => {
    const { type, amount, description, date } = req.body;
    try {
        let expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        expense.type = type || expense.type;
        expense.amount = amount || expense.amount;
        expense.description = description || expense.description;
        expense.date = date || expense.date;

        await expense.save();
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
