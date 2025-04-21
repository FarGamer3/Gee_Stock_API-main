// controllers/api_export.js
const mysql = require('mysql');
require("dotenv").config();
const connection_final = require("../components/connection_final");

/**
 * ດຶງຂໍ້ມູນການນຳອອກສິນຄ້າທັງໝົດ
 */
exports.select_all_exports = (req, res, next) => {
    try {
        const query = `
            SELECT e.exp_id as export_id, e.exp_date as export_date, e.status, e.emp_id, 
                   emp.emp_name 
            FROM export e 
            LEFT JOIN employee emp ON e.emp_id = emp.emp_id
            ORDER BY e.exp_id DESC
        `;
        
        connection_final.query(query, [], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການນຳອອກ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "exports": results
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດຂອງເຊີບເວີ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ" 
        });
    }
};
/**
 * ດຶງຂໍ້ມູນລາຍລະອຽດການນຳອອກສິນຄ້າຕາມລະຫັດ
 */
exports.select_export_details = (req, res, next) => {
    const { export_id } = req.body;
    
    console.log("ໄດ້ຮັບຄໍາຂໍລາຍລະອຽດການນໍາອອກສິນຄ້າ ID:", export_id);
    
    if (!export_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳອອກ" 
        });
    }
    
    try {
        const query = `
            SELECT ed.exp_d_id as export_detail_id, ed.exp_id as export_id, ed.proid, 
                   ed.qty, ed.location, ed.reason,
                   p.ProductName, e.exp_date as export_date, e.status, emp.emp_name
            FROM export_detail ed
            LEFT JOIN products p ON ed.proid = p.proid
            LEFT JOIN export e ON ed.exp_id = e.exp_id
            LEFT JOIN employee emp ON e.emp_id = emp.emp_id
            WHERE ed.exp_id = ?
        `;
        
        console.log("ກໍາລັງໃຊ້ query:", query);
        console.log("ພາລາມິເຕີ:", [export_id]);
        
        connection_final.query(query, [export_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ",
                    "error": err.message
                });
            }
            
            console.log("ຜົນການດຶງຂໍ້ມູນ:", results);
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "export_details": results
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດຂອງເຊີບເວີ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ",
            "error": error.message
        });
    }
};

/**
 * ສ້າງການນຳອອກສິນຄ້າໃໝ່
 */

exports.create_export = (req, res, next) => {
    console.log("ໄດ້ຮັບຄຳຂໍການນຳອອກສິນຄ້າ:", JSON.stringify(req.body));
    
    try {
        // ເລື່ອນຄ່າທີ່ຈຳເປັນຈາກ req.body
        const { emp_id, items } = req.body;
        
        if (!emp_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                "result_code": "400", 
                "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
            });
        }
        
        // ມີແຕ່ການສ້າງຫົວຂໍ້ການນຳອອກເທົ່ານັ້ນ
        const exportQuery = `
            INSERT INTO export (emp_id, exp_date, status) 
            VALUES (?, ?, ?)
        `;
        
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // ຮູບແບບ: YYYY-MM-DD
        
        connection_final.query(
            exportQuery, 
            [emp_id, formattedDate, 'ລໍຖ້າອະນຸມັດ'], 
            (err, exportResult) => {
                if (err) {
                    console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳອອກສິນຄ້າ:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳອອກສິນຄ້າ",
                        "error": err.message
                    });
                }
                
                // ສຳເລັດ
                res.status(200).json({
                    "result_code": "200",
                    "result": "ສ້າງການນຳອອກສິນຄ້າສຳເລັດແລ້ວ",
                    "export_id": exportResult.insertId
                });
            }
        );
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດຂອງເຊີບເວີ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ",
            "error": error.message
        });
    }
};
/**
 * ອັບເດດສະຖານະການນຳອອກສິນຄ້າ
 */
exports.update_export_status = (req, res, next) => {
    const { export_id, status } = req.body;
    
    if (!export_id || !status) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
        });
    }
    
    try {
        // The field in the database is exp_id, but we're receiving export_id from the client
        const query = "UPDATE export SET status = ? WHERE exp_id = ?";
        
        connection_final.query(query, [status, export_id], (err, result) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະການນຳອອກສິນຄ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ",
                    "error": err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    "result_code": "404", 
                    "result": "ບໍ່ພົບຂໍ້ມູນການນຳອອກສິນຄ້າ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ອັບເດດສະຖານະການນຳອອກສິນຄ້າສຳເລັດແລ້ວ"
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດຂອງເຊີບເວີ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ",
            "error": error.message
        });
    }
};

/**
 * ລຶບການນຳອອກສິນຄ້າ
 */
exports.delete_export = (req, res, next) => {
    const { export_id } = req.body;
    
    console.log("ໄດ້ຮັບຄຳຂໍລຶບການນຳອອກສິນຄ້າ ID:", export_id);
    
    if (!export_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳອອກສິນຄ້າ" 
        });
    }
    
    try {
        // ກວດສອບວ່າ export ນີ້ມີຢູ່ຈິງບໍ່
        connection_final.query(
            "SELECT * FROM export WHERE exp_id = ?", 
            [export_id], 
            (err, results) => {
                if (err) {
                    console.error("ຂໍ້ຜິດພາດໃນການກວດສອບການນຳອອກສິນຄ້າ:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການກວດສອບການນຳອອກສິນຄ້າ",
                        "error": err.message
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({ 
                        "result_code": "404", 
                        "result": "ບໍ່ພົບຂໍ້ມູນການນຳອອກສິນຄ້າທີ່ຕ້ອງການລຶບ" 
                    });
                }
                
                // ລຶບຂໍ້ມູນໂດຍກົງໂດຍບໍ່ຕ້ອງໃຊ້ transaction
                const deleteExportQuery = "DELETE FROM export WHERE exp_id = ?";
                
                connection_final.query(deleteExportQuery, [export_id], (err, result) => {
                    if (err) {
                        console.error("ຂໍ້ຜິດພາດໃນການລຶບການນຳອອກສິນຄ້າ:", err);
                        return res.status(500).json({ 
                            "result_code": "500", 
                            "result": "ຂໍ້ຜິດພາດໃນການລຶບການນຳອອກສິນຄ້າ",
                            "error": err.message
                        });
                    }
                    
                    // ສຳເລັດ
                    res.status(200).json({
                        "result_code": "200",
                        "result": "ລຶບການນຳອອກສິນຄ້າສຳເລັດແລ້ວ"
                    });
                });
            }
        );
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດຂອງເຊີບເວີ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ",
            "error": error.message
        });
    }
};