const mongoose = require('mongoose');

const ServiceExpenseSchema = new mongoose.Schema({
    expenseType: {
        type: String,
        required: true,
        enum: ['Parts', 'Technician', 'Other'],
        default: 'Parts'
    },
    amount: {
        type: Number,
        required: true
    },
    relatedService: {
        type: String, // Optional: Name of the service this expense is for
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceExpense', ServiceExpenseSchema);
