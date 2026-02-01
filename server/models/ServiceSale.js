const mongoose = require('mongoose');

const ServiceSaleSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        trim: true
    },
    customerName: {
        type: String,
        trim: true
    },
    charge: {
        type: Number,
        required: true
    },
    cost: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Other'],
        default: 'Cash'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceSale', ServiceSaleSchema);
