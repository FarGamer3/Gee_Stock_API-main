// routes/order.js - Updated to ensure all routes work correctly
var express = require('express');
var router = express.Router();
const api_order = require("../controllers/api_order");

// Order Route - Routes must match exactly what the frontend is calling
router.get('/All/Order', api_order.select_all_order);

// Make sure we have both endpoints available - the one our code was using and the one we want to use
router.post('/Insert/Order', api_order.insert_order);  // This should work with our updated frontend
//router.post('/Insert/Orders', api_order.insert_order); // Keep this as a fallback for current frontend code

router.put('/Update/Order', api_order.update_order);
router.delete('/Delete/Order', api_order.delete_order);

// Order_Detail Route
router.get('/All/Order_Detail', api_order.select_all_order_detail);
router.post('/Order_Detail/With/OrderID', api_order.select_order_detail_with_orderid);
router.post('/Insert/Order_Detail', api_order.insert_order_detail);

// Additional routes with proper naming - with leading slash
router.get('/Get/Orders', api_order.select_all_order);    // Map to existing function
//router.post('/Insert/Orders', api_order.insert_order);     // Map to existing function 
router.put('/Update/Orders', api_order.update_order);   // Map to existing function
router.delete('/Delete/Orders', api_order.delete_order); // Map to existing function

module.exports = router;