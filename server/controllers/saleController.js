const Sale = require('../models/Sale');
const Product = require('../models/Product');

/**
 * @desc    Get all sales
 * @route   GET /api/sales
 * @access  Private
 */
const ServiceSale = require('../models/ServiceSale');

/**
 * @desc    Get all sales (Product Sales + Service Sales merged)
 * @route   GET /api/sales
 * @access  Private
 */
exports.getSales = async (req, res) => {
    try {
        // Fetch both Product Sales and Service Sales
        const productSales = await Sale.find().lean();
        const serviceSales = await ServiceSale.find().lean();

        // Add 'type' field and normalize structure
        const formattedProductSales = productSales.map(sale => ({
            ...sale,
            type: 'product_sale'
        }));

        const formattedServiceSales = serviceSales.map(service => ({
            _id: service._id,
            productName: service.serviceName, // Map service name to productName for frontend compatibility
            customerName: service.customerName,
            quantity: 1,
            unitPrice: service.charge,
            totalPrice: service.charge,
            date: service.date,
            type: 'service_sale',
            originalType: 'service' // unique identifier
        }));

        // Merge and sort by date descending
        const allSales = [...formattedProductSales, ...formattedServiceSales].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        res.json(allSales);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Create a new sale
 * @route   POST /api/sales
 * @access  Private
 */
exports.createSale = async (req, res) => {
    const { productName, productId, quantity, unitPrice, totalPrice, date } = req.body;
    try {
        const newSale = new Sale({
            productName,
            productId: productId || null,
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            totalPrice: parseFloat(totalPrice),
            date: date || Date.now()
        });

        const sale = await newSale.save();

        // Stock update is handled in frontend/AddSaleScreen via separate call, 
        // but ideally should be here or transactional. 
        // For now, keeping consistent with current app flow where stock might be decremented separately,
        // BUT AddSaleScreen calls decrease-stock endpoint. 
        // To be safe and clean, we should let this just save the record. 
        // The frontend currently calls:
        // 1. Ledger update (Frontend/Local)
        // 2. Decrease Stock API
        // We are replacing step 1 with this API call.

        // Note: Ideally we should handle stock decrement here too to ensure atomicity,
        // but user only asked for Report feature. Let's stick to recording the sale for now.
        // If we duplicate logic, we might double-decrement if frontend keeps calling both.
        // Frontend Plan: SalesContext.addSale will call this.
        // ReportsScreen will use backend data.

        res.json(sale);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * @desc    Delete a sale
 * @route   DELETE /api/sales/:id
 * @access  Private
 */
exports.deleteSale = async (req, res) => {
    try {
        // Try finding in Product Sales first
        let sale = await Sale.findById(req.params.id);

        if (sale) {
            // Restore stock if productId exists
            if (sale.productId && sale.quantity) {
                const product = await Product.findById(sale.productId);
                if (product) {
                    product.stock += sale.quantity;
                    await product.save();
                }
            }
            await sale.deleteOne();
            return res.json({ msg: 'Product Sale removed and stock restored' });
        }

        // If not found, check Service Sales
        const serviceSale = await ServiceSale.findById(req.params.id);
        if (serviceSale) {
            await serviceSale.deleteOne();
            return res.json({ msg: 'Service Sale removed' });
        }

        return res.status(404).json({ msg: 'Sale not found' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
