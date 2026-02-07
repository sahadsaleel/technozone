const User = require('../models/User');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const ServiceSale = require('../models/ServiceSale');
const ServiceExpense = require('../models/ServiceExpense');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    const { name, email, themePreference, fontSize } = req.body;

    const profileFields = {};
    if (name) profileFields.name = name;
    if (email) profileFields.email = email;
    if (themePreference) profileFields.themePreference = themePreference;
    if (fontSize) profileFields.fontSize = fontSize;

    try {
        // Check if email is already taken by another user
        if (email) {
            let user = await User.findOne({ email });
            if (user && user._id.toString() !== req.user.id) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        let user = await User.findById(req.user.id);

        if (user) {
            // Update
            user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: profileFields },
                { new: true }
            ).select('-password');
            return res.json(user);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Change password
// @route   PUT /api/user/password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete account
// @route   DELETE /api/user/account
// @access  Private
exports.deleteAccount = async (req, res) => {
    const { password } = req.body;

    try {
        const user = await User.findById(req.user.id);

        // Verify password for security
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password. Account deletion aborted.' });
        }

        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export user data
// @route   GET /api/user/data
// @access  Private
// @desc    Export user data
// @route   GET /api/user/export
// @access  Private
exports.exportUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const products = await Product.find({});
        const expenses = await Expense.find({});
        const sales = await Sale.find({});
        const purchases = await Purchase.find({});

        const userData = {
            profile: user,
            exportedAt: new Date().toISOString(),
            products,
            expenses,
            sales,
            purchases
        };
        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Import user data
// @route   POST /api/user/import
// @access  Private
exports.importUserData = async (req, res) => {
    const { products, expenses, sales, purchases } = req.body;

    try {
        // Bulk Write Products
        if (products && products.length > 0) {
            const productOps = products.map(p => ({
                updateOne: {
                    filter: { _id: p._id },
                    update: { $set: p },
                    upsert: true
                }
            }));
            await Product.bulkWrite(productOps);
        }

        // Bulk Write Expenses
        if (expenses && expenses.length > 0) {
            const expenseOps = expenses.map(e => ({
                updateOne: {
                    filter: { _id: e._id },
                    update: { $set: e },
                    upsert: true
                }
            }));
            await Expense.bulkWrite(expenseOps);
        }

        // Bulk Write Sales
        if (sales && sales.length > 0) {
            const saleOps = sales.map(s => ({
                updateOne: {
                    filter: { _id: s._id },
                    update: { $set: s },
                    upsert: true
                }
            }));
            await Sale.bulkWrite(saleOps);
        }

        // Bulk Write Purchases
        if (purchases && purchases.length > 0) {
            const purchaseOps = purchases.map(p => ({
                updateOne: {
                    filter: { _id: p._id },
                    update: { $set: p },
                    upsert: true
                }
            }));
            await Purchase.bulkWrite(purchaseOps);
        }

        res.json({ message: 'Data imported successfully' });
    } catch (err) {
        console.error('Import Error:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
};

// @desc    Delete all data
// @route   DELETE /api/user/data
// @access  Private
exports.deleteAllData = async (req, res) => {
    try {
        // Clear all collections except Users
        await Promise.all([
            Product.deleteMany({}),
            Expense.deleteMany({}),
            Sale.deleteMany({}),
            Purchase.deleteMany({}),
            ServiceSale.deleteMany({}),
            ServiceExpense.deleteMany({})
        ]);

        res.json({ message: 'All data has been cleared successfully' });
    } catch (err) {
        console.error('Delete All Data Error:', err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
};
