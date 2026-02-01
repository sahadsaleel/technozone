const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Rent', 'Electricity', 'Transport', 'Salary', 'Other']
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
