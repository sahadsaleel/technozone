const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

/**
 * @desc    Get all purchases
 * @route   GET /api/purchases
 * @access  Private
 */
exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate('productId', 'name')
            .sort({ date: -1 });
        res.json(purchases);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Create a new purchase
 * @route   POST /api/purchases
 * @access  Private
 */
exports.createPurchase = async (req, res) => {
    const { productId, quantity, totalCost, date } = req.body;
    try {
        const newPurchase = new Purchase({
            productId,
            quantity,
            totalCost,
            date
        });

        const purchase = await newPurchase.save();

        // Update Product Stock
        const product = await Product.findById(productId);
        if (product) {
            product.stock += parseInt(quantity);
            await product.save();
        }

        res.json(purchase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
