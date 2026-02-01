const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    deleteAccount,
    exportUserData,
    importUserData
} = require('../controllers/userController');

// All routes are protected
router.use(auth);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);
router.get('/export', exportUserData);
router.post('/import', importUserData);

module.exports = router;
