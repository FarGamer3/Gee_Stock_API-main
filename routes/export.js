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
// ເພີ່ມໃນໄຟລ໌ routes/export.js
router.post('/test-export', (req, res) => {
    console.log('Test export endpoint received:', req.body);
    res.status(200).json({
      result_code: "200",
      result: "Test endpoint successful",
      received: req.body
    });
  });
  // ສ້າງເສັ້ນທາງໃໝ່ສຳລັບກວດສອບໂຄງສ້າງຕາຕະລາງ
router.get('/check-tables', (req, res) => {
    try {
      // ກວດສອບໂຄງສ້າງຕາຕະລາງ export
      connection_final.query("SHOW COLUMNS FROM export", (err, exportColumns) => {
        if (err) {
          return res.status(500).json({
            result_code: "500",
            error: "Error checking export table",
            details: err.message
          });
        }
        
        // ກວດສອບໂຄງສ້າງຕາຕະລາງ export_detail
        connection_final.query("SHOW COLUMNS FROM export_detail", (err, detailColumns) => {
          if (err) {
            return res.status(500).json({
              result_code: "500",
              error: "Error checking export_detail table",
              details: err.message
            });
          }
          
          // ສົ່ງຄືນຂໍ້ມູນທັງໝົດ
          res.status(200).json({
            result_code: "200",
            result: "Tables checked successfully",
            export_columns: exportColumns,
            export_detail_columns: detailColumns
          });
        });
      });
    } catch (error) {
      res.status(500).json({
        result_code: "500",
        error: "Server error during table check",
        details: error.message
      });
    }
  });
  // ສ້າງເສັ້ນທາງສຳລັບທົດສອບ
router.post('/test-detail', (req, res) => {
    // ຮັບຄ່າ export_id ທີ່ມີຢູ່ແລ້ວໃນຕາຕະລາງ export
    const { export_id, proid } = req.body;
    
    if (!export_id || !proid) {
      return res.status(400).json({
        result_code: "400",
        result: "Missing required parameters"
      });
    }
    
    // ລອງບັນທຶກລາຍລະອຽດທົດສອບ
    const query = `
      INSERT INTO export_detail (exp_id, proid, qty, location, reason) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    connection_final.query(query, [export_id, proid, 1, "Test location", "Test reason"], (err, result) => {
      if (err) {
        return res.status(500).json({
          result_code: "500",
          error: "Error inserting test detail",
          details: err.message
        });
      }
      
      res.status(200).json({
        result_code: "200",
        result: "Test detail inserted successfully",
        insert_id: result.insertId
      });
    });
  });

module.exports = router;