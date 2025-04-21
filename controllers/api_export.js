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
        const { emp_id, export_date, items } = req.body;
        
        if (!emp_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                "result_code": "400", 
                "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
            });
        }
        
        // ໃຊ້ວັນທີທີ່ສົ່ງມາ ຫຼື ວັນທີປັດຈຸບັນ
        const formattedDate = export_date ? export_date : new Date().toISOString().split('T')[0];
        
        // ໃຊ້ການເຮັດວຽກກັບຖານຂໍ້ມູນແບບ Transaction ເພື່ອຮັບປະກັນຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ
        connection_final.pool.getConnection((err, connection) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ",
                    "error": err.message
                });
            }
            
            connection.beginTransaction((err) => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction",
                        "error": err.message
                    });
                }
                
                // 1. ບັນທຶກຂໍ້ມູນໃນຕາຕະລາງ export
                const exportQuery = `
                    INSERT INTO export (emp_id, exp_date, status) 
                    VALUES (?, ?, 'ລໍຖ້າອະນຸມັດ')
                `;
                
                connection.query(exportQuery, [emp_id, formattedDate], (err, exportResult) => {
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
                    
                    // 2. ບັນທຶກລາຍລະອຽດການນຳອອກສິນຄ້າ
                    const insertDetails = [];
                    const values = [];
                    
                    items.forEach(item => {
                        // ກວດສອບ property ຂອງແຕ່ລະລາຍການ
                        const productId = item.id || item.proid;
                        const quantity = item.exportQuantity || item.qty || 1;
                        const location = item.exportLocation || item.location || '';
                        const reason = item.exportReason || item.reason || 'ບໍ່ໄດ້ລະບຸສາເຫດ';
                        
                        if (!productId) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("ຂໍ້ຜິດພາດ: ບໍ່ມີລະຫັດສິນຄ້າ");
                                res.status(400).json({ 
                                    "result_code": "400", 
                                    "result": "ຂໍ້ຜິດພາດ: ບໍ່ມີລະຫັດສິນຄ້າ"
                                });
                            });
                        }
                        
                        // ສ້າງ parameter placeholders ສຳລັບແຕ່ລະລາຍການ
                        insertDetails.push("(?, ?, ?, ?, ?)");
                        values.push(exportId, productId, quantity, location, reason);
                    });
                    
                    if (insertDetails.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("ຂໍ້ຜິດພາດ: ບໍ່ມີລາຍລະອຽດສິນຄ້າທີ່ຖືກຕ້ອງ");
                            res.status(400).json({ 
                                "result_code": "400", 
                                "result": "ຂໍ້ຜິດພາດ: ບໍ່ມີລາຍລະອຽດສິນຄ້າທີ່ຖືກຕ້ອງ"
                            });
                        });
                    }
                    
                    // 3. ເພີ່ມລາຍລະອຽດການນຳອອກສິນຄ້າທັງໝົດໃນຄຳສັ່ງດຽວ
                    const detailsQuery = `
                        INSERT INTO export_detail (exp_id, proid, qty, location, reason) 
                        VALUES ${insertDetails.join(',')}
                    `;
                    
                    connection.query(detailsQuery, values, (err, detailsResult) => {
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
                        
                        // 4. ປັບປຸງຈຳນວນສິນຄ້າໃນສາງ
                        const updatePromises = items.map(item => {
                            return new Promise((resolve, reject) => {
                                const productId = item.id || item.proid;
                                const quantity = item.exportQuantity || item.qty || 1;
                                
                                // ດຶງຂໍ້ມູນຈຳນວນສິນຄ້າປັດຈຸບັນ
                                connection.query(
                                    "SELECT qty FROM products WHERE proid = ?", 
                                    [productId], 
                                    (err, results) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        
                                        if (results.length === 0) {
                                            return reject(new Error(`ບໍ່ພົບສິນຄ້າທີ່ມີລະຫັດ ${productId}`));
                                        }
                                        
                                        const currentQty = results[0].qty;
                                        // ກັນບໍ່ໃຫ້ຈຳນວນຕິດລົບ
                                        const newQty = Math.max(0, currentQty - quantity);
                                        
                                        // ອັບເດດຈຳນວນສິນຄ້າ
                                        connection.query(
                                            "UPDATE products SET qty = ? WHERE proid = ?", 
                                            [newQty, productId], 
                                            (err, updateResult) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                
                                                resolve();
                                            }
                                        );
                                    }
                                );
                            });
                        });
                        
                        Promise.all(updatePromises)
                            .then(() => {
                                // ຖ້າທຸກຢ່າງສຳເລັດ, ຍອມຮັບການປ່ຽນແປງ (commit)
                                connection.commit(err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("ຂໍ້ຜິດພາດໃນການ commit:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "ຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ",
                                                "error": err.message
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
                            })
                            .catch(error => {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການປັບປຸງຈຳນວນສິນຄ້າ:", error);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການປັບປຸງຈຳນວນສິນຄ້າ",
                                        "error": error.message
                                    });
                                });
                            });
                    });
                });
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
                
                // ເລີ່ມ transaction ເພື່ອລຶບຂໍ້ມູນແລະຄືນຄ່າສິນຄ້າ
                connection_final.pool.getConnection((err, connection) => {
                    if (err) {
                        console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນ:", err);
                        return res.status(500).json({ 
                            "result_code": "500", 
                            "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນ",
                            "error": err.message
                        });
                    }
                    
                    connection.beginTransaction(err => {
                        if (err) {
                            connection.release();
                            console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                            return res.status(500).json({ 
                                "result_code": "500", 
                                "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction",
                                "error": err.message
                            });
                        }
                        
                        // 1. ດຶງຂໍ້ມູລລາຍລະອຽດເພື່ອຄືນຄ່າສິນຄ້າ
                        connection.query(
                            "SELECT proid, qty FROM export_detail WHERE exp_id = ?", 
                            [export_id], 
                            (err, detailsResults) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກ:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳອອກ",
                                            "error": err.message
                                        });
                                    });
                                }
                                
                                // 2. ຄືນສິນຄ້າເຂົ້າສາງ
                                const updatePromises = detailsResults.map(detail => {
                                    return new Promise((resolve, reject) => {
                                        // ດຶງຂໍ້ມູນຈຳນວນສິນຄ້າປັດຈຸບັນ
                                        connection.query(
                                            "SELECT qty FROM products WHERE proid = ?", 
                                            [detail.proid], 
                                            (err, productResults) => {
                                                if (err) {
                                                    return reject(err);
                                                }
                                                
                                                if (productResults.length === 0) {
                                                    return resolve(); // ຂ້າມຖ້າສິນຄ້າບໍ່ມີໃນລະບົບແລ້ວ
                                                }
                                                
                                                const currentQty = productResults[0].qty;
                                                const newQty = currentQty + detail.qty;
                                                
                                                // ອັບເດດຈຳນວນສິນຄ້າ
                                                connection.query(
                                                    "UPDATE products SET qty = ? WHERE proid = ?", 
                                                    [newQty, detail.proid], 
                                                    (err, updateResult) => {
                                                        if (err) {
                                                            return reject(err);
                                                        }
                                                        
                                                        resolve();
                                                    }
                                                );
                                            }
                                        );
                                    });
                                });
                                
                                Promise.all(updatePromises)
                                    .then(() => {
                                        // 3. ລຶບລາຍລະອຽດການນຳອອກ
                                        connection.query(
                                            "DELETE FROM export_detail WHERE exp_id = ?", 
                                            [export_id], 
                                            (err, deleteDetailsResult) => {
                                                if (err) {
                                                    return connection.rollback(() => {
                                                        connection.release();
                                                        console.error("ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳອອກ:", err);
                                                        res.status(500).json({ 
                                                            "result_code": "500", 
                                                            "result": "ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳອອກ",
                                                            "error": err.message
                                                        });
                                                    });
                                                }
                                                
                                                // 4. ລຶບຂໍ້ມູນຫຼັກ
                                                connection.query(
                                                    "DELETE FROM export WHERE exp_id = ?", 
                                                    [export_id], 
                                                    (err, deleteExportResult) => {
                                                        if (err) {
                                                            return connection.rollback(() => {
                                                                connection.release();
                                                                console.error("ຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນຫຼັກ:", err);
                                                                res.status(500).json({ 
                                                                    "result_code": "500", 
                                                                    "result": "ຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນຫຼັກ",
                                                                    "error": err.message
                                                                });
                                                            });
                                                        }
                                                        
                                                        // Commit transaction
                                                        connection.commit(err => {
                                                            if (err) {
                                                                return connection.rollback(() => {
                                                                    connection.release();
                                                                    console.error("ຂໍ້ຜິດພາດໃນການ commit transaction:", err);
                                                                    res.status(500).json({ 
                                                                        "result_code": "500", 
                                                                        "result": "ຂໍ້ຜິດພາດໃນການ commit transaction",
                                                                        "error": err.message
                                                                    });
                                                                });
                                                            }
                                                            
                                                            connection.release();
                                                            res.status(200).json({
                                                                "result_code": "200",
                                                                "result": "ລຶບການນຳອອກສິນຄ້າສຳເລັດແລ້ວ"
                                                            });
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    })
                                    .catch(error => {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("ຂໍ້ຜິດພາດໃນການຄືນຈຳນວນສິນຄ້າ:", error);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "ຂໍ້ຜິດພາດໃນການຄືນຈຳນວນສິນຄ້າ",
                                                "error": error.message
                                            });
                                        });
                                    });
                            });
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