// routes/sale.js - Enhanced with additional endpoints
var express = require('express');
var router = express.Router();
const api_sales = require("../controllers/api_sales");

/**
 * ເສັ້ນທາງ (Routes) ສຳລັບຈັດການການຂາຍສິນຄ້າ
 * 
 * 1. ສ້າງການຂາຍໃໝ່ - POST /Insert/Sales
 * 2. ດຶງຂໍ້ມູນການຂາຍທັງໝົດ - GET /All/Sales
 * 3. ດຶງລາຍລະອຽດການຂາຍ - POST /Sale/Details
 * 4. ດຶງຂໍ້ມູນການຂາຍຕາມລະຫັດ - POST /Sale/ById
 * 5. ລຶບຂໍ້ມູນການຂາຍ - DELETE /Delete/Sale
 * 6. ຄົ້ນຫາຂໍ້ມູນການຂາຍ - POST /Search/Sales
 * 7. ດຶງສະຫຼຸບຍອດຂາຍປະຈຳວັນ - POST /Daily/Summary
 */

// ສ້າງການຂາຍໃໝ່
router.post('/Insert/Sales', api_sales.insert_sales);

// ດຶງຂໍ້ມູນການຂາຍທັງໝົດ
router.get('/All/Sales', api_sales.select_all_sales);

// ດຶງລາຍລະອຽດການຂາຍຕາມລະຫັດ
router.post('/Sale/Details', api_sales.select_sale_details);

// ດຶງຂໍ້ມູນການຂາຍຕາມລະຫັດ
router.post('/Sale/ById', api_sales.select_sale_by_id);

// ລຶບຂໍ້ມູນການຂາຍ (ຍົກເລີກການຂາຍ)
router.delete('/Delete/Sale', api_sales.delete_sale);

// ຄົ້ນຫາຂໍ້ມູນການຂາຍຕາມເງື່ອນໄຂ
router.post('/Search/Sales', api_sales.search_sales);

// ດຶງສະຫຼຸບຍອດຂາຍປະຈຳວັນ
router.post('/Daily/Summary', api_sales.get_daily_sales_summary);

module.exports = router;