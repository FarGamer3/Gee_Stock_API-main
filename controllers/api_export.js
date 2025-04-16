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
            SELECT e.export_id, e.export_date, e.status, e.emp_id, 
                   emp.emp_name 
            FROM export e 
            LEFT JOIN employee emp ON e.emp_id = emp.emp_id
            ORDER BY e.export_id DESC
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
    
    if (!export_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳອອກ" 
        });
    }
    
    try {
        const query = `
            SELECT ed.export_detail_id, ed.export_id, ed.proid, 
                   ed.qty, ed.location, ed.reason,
                   p.ProductName, e.export_date, e.status, emp.emp_name
            FROM export_detail ed
            LEFT JOIN products p ON ed.proid = p.proid
            LEFT JOIN export e ON ed.export_id = e.export_id
            LEFT JOIN employee emp ON e.emp_id = emp.emp_id
            WHERE ed.export_id = ?
        `;
        
        connection_final.query(query, [export_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
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
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ" 
        });
    }
};

/**
 * ສ້າງການນຳອອກສິນຄ້າໃໝ່
 */
exports.create_export = (req, res, next) => {
    console.log("ໄດ້ຮັບຄຳຂໍການນຳອອກສິນຄ້າ:", JSON.stringify(req.body));
    
    const { emp_id, export_date, status, items } = req.body;
    
    if (!emp_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
        });
    }
    
    try {
        // ໃຊ້ transaction ເພື່ອຮັບປະກັນຄວາມສົມບູນຂອງຂໍ້ມູນ
        connection_final.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", connectionErr);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່"
                });
            }
            
            // ເລີ່ມ transaction
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction"
                    });
                }
                
                // 1. ສ້າງການນຳອອກສິນຄ້າໃໝ່
                const exportQuery = `
                    INSERT INTO export (emp_id, export_date, status) 
                    VALUES (?, ?, ?)
                `;
                
                connection.query(
                    exportQuery, 
                    [emp_id, export_date || new Date(), status || 'ລໍຖ້າອະນຸມັດ'], 
                    (err, exportResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳອອກສິນຄ້າ:", err);
                                res.status(500).json({ 
                                    "result_code": "500", 
                                    "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳອອກສິນຄ້າ",
                                    "error": err.message
                                });
                            });
                        }
                        
                        const exportId = exportResult.insertId;
                        
                        // 2. ເພີ່ມລາຍລະອຽດການນຳອອກສິນຄ້າ
                        const detailValues = items.map(item => [
                            exportId, 
                            item.id || item.proid, 
                            item.exportQuantity || item.qty,
                            item.exportLocation || item.location || '',
                            item.exportReason || item.reason
                        ]);
                        
                        const detailQuery = `
                            INSERT INTO export_detail (export_id, proid, qty, location, reason) 
                            VALUES ?
                        `;
                        
                        connection.query(detailQuery, [detailValues], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳອອກສິນຄ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳອອກສິນຄ້າ",
                                        "error": err.message
                                    });
                                });
                            }
                            
                            // 3. ອັບເດດຈຳນວນສິນຄ້າໃນສາງ
                            let updateIndex = 0;
                            
                            const updateNextStock = () => {
                                if (updateIndex >= items.length) {
                                    // ຖ້າອັບເດດທຸກລາຍການສຳເລັດແລ້ວ, ໃຫ້ commit transaction
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການຢືນຢັນການເຮັດ transaction:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "ຂໍ້ຜິດພາດໃນການຢືນຢັນການເຮັດ transaction"
                                                });
                                            });
                                        }
                                        
                                        connection.release();
                                        res.status(200).json({
                                            "result_code": "200",
                                            "result": "ສ້າງການນຳອອກສິນຄ້າສຳເລັດແລ້ວ",
                                            "export_id": exportId
                                        });
                                    });
                                    return;
                                }
                                
                                const item = items[updateIndex];
                                const itemQty = item.exportQuantity || item.qty;
                                const itemId = item.id || item.proid;
                                
                                // ຫຼຸດຈຳນວນສິນຄ້າໃນສາງ (ຮັບປະກັນວ່າຈະບໍ່ຕິດລົບ)
                                connection.query(
                                    "UPDATE products SET qty = GREATEST(0, qty - ?) WHERE proid = ?", 
                                    [itemQty, itemId], 
                                    (err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ",
                                                    "error": err.message
                                                });
                                            });
                                        }
                                        
                                        updateIndex++;
                                        updateNextStock();
                                    }
                                );
                            };
                            
                            // ເລີ່ມອັບເດດສິນຄ້າທີ່ລະຕົວ
                            updateNextStock();
                        });
                    }
                );
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
        const query = "UPDATE export SET status = ? WHERE export_id = ?";
        
        connection_final.query(query, [status, export_id], (err, result) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະການນຳອອກສິນຄ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
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
            "result": "ຂໍ້ຜິດພາດຂອງເຊີບເວີ" 
        });
    }
};

/**
 * ລຶບການນຳອອກສິນຄ້າ
 */
exports.delete_export = (req, res, next) => {
    const { export_id } = req.body;
    
    if (!export_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳອອກສິນຄ້າ" 
        });
    }
    
    try {
        // ເລີ່ມການເຮັດ transaction
        connection_final.beginTransaction(err => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction" 
                });
            }
            
            // 1. ດຶງລາຍລະອຽດການນຳອອກສິນຄ້າກ່ອນລຶບ ເພື່ອເພີ່ມຈຳນວນສິນຄ້າກັບຄືນໄປໃນສາງ
            const getDetailsQuery = `
                SELECT proid, qty FROM export_detail WHERE export_id = ?
            `;
            
            connection_final.query(getDetailsQuery, [export_id], (err, details) => {
                if (err) {
                    return connection_final.rollback(() => {
                        console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກສິນຄ້າ:", err);
                        res.status(500).json({ 
                            "result_code": "500", 
                            "result": "ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກສິນຄ້າ" 
                        });
                    });
                }
                
                // 2. ເພີ່ມຈຳນວນສິນຄ້າກັບຄືນໄປໃນສາງ
                const updateStockPromises = details.map(detail => {
                    return new Promise((resolve, reject) => {
                        const updateQuery = `
                            UPDATE products 
                            SET qty = qty + ? 
                            WHERE proid = ?
                        `;
                        
                        connection_final.query(updateQuery, [detail.qty, detail.proid], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                });
                
                Promise.all(updateStockPromises)
                    .then(() => {
                        // 3. ລຶບລາຍລະອຽດການນຳອອກສິນຄ້າ
                        const deleteDetailsQuery = "DELETE FROM export_detail WHERE export_id = ?";
                        
                        connection_final.query(deleteDetailsQuery, [export_id], (err) => {
                            if (err) {
                                return connection_final.rollback(() => {
                                    console.error("ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳອອກສິນຄ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳອອກສິນຄ້າ" 
                                    });
                                });
                            }
                            
                            // 4. ລຶບການນຳອອກສິນຄ້າ
                            const deleteExportQuery = "DELETE FROM export WHERE export_id = ?";
                            
                            connection_final.query(deleteExportQuery, [export_id], (err, result) => {
                                if (err) {
                                    return connection_final.rollback(() => {
                                        console.error("ຂໍ້ຜິດພາດໃນການລຶບການນຳອອກສິນຄ້າ:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "ຂໍ້ຜິດພາດໃນການລຶບການນຳອອກສິນຄ້າ" 
                                        });
                                    });
                                }
                                
                                if (result.affectedRows === 0) {
                                    return connection_final.rollback(() => {
                                        res.status(404).json({ 
                                            "result_code": "404", 
                                            "result": "ບໍ່ພົບຂໍ້ມູນການນຳອອກສິນຄ້າ" 
                                        });
                                    });
                                }
                                
                                // ຢືນຢັນການເຮັດ transaction
                                connection_final.commit(err => {
                                    if (err) {
                                        return connection_final.rollback(() => {
                                            console.error("ຂໍ້ຜິດພາດໃນການຢືນຢັນການເຮັດ transaction:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "ຂໍ້ຜິດພາດໃນການຢືນຢັນການເຮັດ transaction" 
                                            });
                                        });
                                    }
                                    
                                    // ສົ່ງຄຳຕອບກັບຄືນ
                                    res.status(200).json({
                                        "result_code": "200",
                                        "result": "ລຶບການນຳອອກສິນຄ້າສຳເລັດແລ້ວ"
                                    });
                                });
                            });
                        });
                    })
                    .catch(err => {
                        connection_final.rollback(() => {
                            console.error("ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ" 
                            });
                        });
                    });
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