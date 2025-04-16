// routes/export.js
var express = require('express');
var router = express.Router();
const api_export = require("../controllers/api_export");

// Export routes
router.get('/All/Export', api_export.select_all_exports);
router.post('/Export/Details', api_export.select_export_details);
router.post('/Create/Export', api_export.create_export);
router.put('/Update/Status', api_export.update_export_status);
router.delete('/Delete/Export', api_export.delete_export);

module.exports = router;