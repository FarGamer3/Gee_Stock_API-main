// routes/import.js
var express = require('express');
var router = express.Router();
const api_import = require("../controllers/api_import");

// Import routes
router.get('/All/Import', api_import.select_all_imports);
router.post('/Import/Details', api_import.select_import_details);
router.post('/Create/Import', api_import.create_import);
router.get('/Pending/Orders', api_import.get_pending_orders);
router.post('/Order/Products', api_import.get_order_products);
router.put('/Update/Status', api_import.update_import_status);
router.delete('/Delete/Import', api_import.delete_import);

module.exports = router;