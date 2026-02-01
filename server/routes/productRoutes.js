const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

router.get('/', auth, productController.getProducts);
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.put('/:id/decrease-stock', auth, productController.decreaseStock);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
