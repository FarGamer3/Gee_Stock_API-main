var express = require('express');
var router = express.Router();
const connection_final= require("../components/connection_final");
const api_products= require("../controllers/api_products");





// Category Route
router.get('/All/Category', api_products.select_all_category);
router.post('/Category/With/ID', api_products.select_category_with_id);
router.post('/Insert/Category', api_products.insert_category);
router.put('/Update/Category', api_products.update_category);
router.delete('/Delete/Category', api_products.delete_category);

// Brand Route
router.get('/All/Brand', api_products.select_all_brand);
router.post('/Brand/With/ID', api_products.select_brand_with_id);
router.post('/Insert/Brand', api_products.insert_brand);
router.put('/Update/Brand', api_products.update_brand);
router.delete('/Delete/Brand', api_products.delete_brand);

// Zone Route
router.get('/All/Zone', api_products.select_all_zone);
router.post('/Zone/With/ID', api_products.select_zone_with_id);
router.post('/Insert/Zone', api_products.insert_zone);
router.put('/Update/Zone', api_products.update_zone);
router.delete('/Delete/Zone', api_products.delete_zone);

// Model Route
// router.get('/All/Model', api_products.select_all_model);
// router.post('/Model/With/ID', api_products.select_model_with_id);
// router.post('/Insert/Model', api_products.insert_model);
// router.put('/Update/Model', api_products.update_model);
// router.delete('/Delete/Model', api_products.delete_model);

// Product Route
router.get('/All/Product', api_products.select_all_product);
router.post('/Product/With/ID', api_products.select_product_with_proname);
router.post('/products/search', api_products.search_products);
router.post('/Insert/Product', api_products.insert_product);
router.put('/Update/Product', api_products.update_product);
router.delete('/Delete/Product', api_products.delete_product);
router.get('/All/Min/Product', api_products.select_min_product);


module.exports = router;
