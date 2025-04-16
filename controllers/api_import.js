// controllers/api_import.js
const mysql = require('mysql');
require("dotenv").config();
const connection_final = require("../components/connection_final");

/**
 * ດຶງຂໍ້ມູນການນຳເຂົ້າທັງໝົດ
 */
exports.select_all_imports = (req, res, next) => {
    try {
        const query = `
            SELECT i.imp_id, i.imp_date, i.order_id, i.total_price, i.status, 
                   e.emp_name 
            FROM import i 
            LEFT JOIN employee e ON i.emp_id = e.emp_id
            ORDER BY i.imp_id DESC
        `;
        
        connection_final.query(query, [], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການນຳເຂົ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "imports": results
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
 * ດຶງຂໍ້ມູນລາຍລະອຽດການນຳເຂົ້າສະເພາະ
 */
exports.select_import_details = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳເຂົ້າ" 
        });
    }
    
    try {
        const query = `
            SELECT id.imp_d_id, id.imp_id, id.qty, id.cost_price, 
                  (id.qty * id.cost_price) as subtotal,
                   p.proid, p.ProductName, i.imp_date, i.status, e.emp_name
            FROM import_detail id
            LEFT JOIN products p ON id.pro_id = p.proid
            LEFT JOIN import i ON id.imp_id = i.imp_id
            LEFT JOIN employee e ON i.emp_id = e.emp_id
            WHERE id.imp_id = ?
        `;
        
        connection_final.query(query, [imp_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳເຂົ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "import_details": results
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
 * ດຶງຂໍ້ມູນລາຍການສັ່ງຊື້ທີ່ລໍຖ້ານຳເຂົ້າ
 */
exports.get_pending_orders = (req, res, next) => {
    try {
        // ດຶງລາຍການສັ່ງຊື້ທີ່ຍັງບໍ່ໄດ້ນຳເຂົ້າ
        const query = `
            SELECT DISTINCT o.order_id, o.order_date, s.sup_name as supplier, e.emp_name as employee 
            FROM orders o 
            LEFT JOIN supplier s ON o.sup_id = s.sup_id 
            LEFT JOIN employee e ON o.emp_id = e.emp_id 
            LEFT JOIN import i ON o.order_id = i.order_id
            WHERE i.imp_id IS NULL OR i.status = 'Pending'
            ORDER BY o.order_id DESC
        `;
        
        connection_final.query(query, [], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍການລໍຖ້ານຳເຂົ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "pending_orders": results
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
 * ດຶງຂໍ້ມູນສິນຄ້າໃນລາຍການສັ່ງຊື້
 */
exports.get_order_products = (req, res, next) => {
    const { order_id } = req.body;
    
    if (!order_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການສັ່ງຊື້" 
        });
    }
    
    try {
        const query = `
            SELECT od.order_d_id, od.proid, od.qty, p.ProductName, p.cost_price
            FROM order_detail od
            LEFT JOIN products p ON od.proid = p.proid
            WHERE od.order_id = ?
        `;
        
        connection_final.query(query, [order_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນສິນຄ້າໃນລາຍການສັ່ງຊື້:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ສຳເລັດ",
                "order_products": results
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
 * ສ້າງການນຳເຂົ້າສິນຄ້າໃໝ່
 */
exports.create_import = (req, res, next) => {
    console.log("ໄດ້ຮັບຄຳຂໍການນຳເຂົ້າ:", JSON.stringify(req.body));
    
    const { emp_id, order_id, imp_date, status, total_price, items } = req.body;
    
    // ກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ
    if (!emp_id || !order_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
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
            
            // 1. ເພີ່ມຂໍ້ມູນການນຳເຂົ້າລົງໃນຕາຕະລາງ import
            const importQuery = `
                INSERT INTO import (emp_id, order_id, imp_date, total_price, status) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            connection_final.query(
                importQuery, 
                [emp_id, order_id, imp_date || new Date(), total_price, status || 'Completed'], 
                (err, importResult) => {
                    if (err) {
                        return connection_final.rollback(() => {
                            console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳເຂົ້າ:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນການນຳເຂົ້າ",
                                "error": err.message
                            });
                        });
                    }
                    
                    const impId = importResult.insertId;
                    
                    // 2. ເພີ່ມລາຍລະອຽດການນຳເຂົ້າ
                    const detailValues = items.map(item => [
                        impId, 
                        item.proid, 
                        item.qty, 
                        item.cost_price
                    ]);
                    
                    const detailQuery = `
                        INSERT INTO import_detail (imp_id, pro_id, qty, cost_price) 
                        VALUES ?
                    `;
                    
                    connection_final.query(detailQuery, [detailValues], (err) => {
                        if (err) {
                            return connection_final.rollback(() => {
                                console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳເຂົ້າ:", err);
                                res.status(500).json({ 
                                    "result_code": "500", 
                                    "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳເຂົ້າ",
                                    "error": err.message
                                });
                            });
                        }
                        
                        // 3. ອັບເດດຈຳນວນສິນຄ້າໃນສາງ
                        const updateStockPromises = items.map(item => {
                            return new Promise((resolve, reject) => {
                                const updateQuery = `
                                    UPDATE products 
                                    SET qty = qty + ? 
                                    WHERE proid = ?
                                `;
                                
                                connection_final.query(updateQuery, [item.qty, item.proid], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            });
                        });
                        
                        Promise.all(updateStockPromises)
                            .then(() => {
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
                                        "result": "ສ້າງການນຳເຂົ້າສຳເລັດແລ້ວ",
                                        "imp_id": impId
                                    });
                                });
                            })
                            .catch(err => {
                                connection_final.rollback(() => {
                                    console.error("ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ",
                                        "error": err.message
                                    });
                                });
                            });
                    });
                }
            );
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
 * ອັບເດດສະຖານະການນຳເຂົ້າ
 */
exports.update_import_status = (req, res, next) => {
    const { imp_id, status } = req.body;
    
    if (!imp_id || !status) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
        });
    }
    
    try {
        const query = "UPDATE import SET status = ? WHERE imp_id = ?";
        
        connection_final.query(query, [status, imp_id], (err, result) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະການນຳເຂົ້າ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດຈາກຖານຂໍ້ມູນ" 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    "result_code": "404", 
                    "result": "ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "ອັບເດດສະຖານະການນຳເຂົ້າສຳເລັດແລ້ວ"
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
 * ລຶບການນຳເຂົ້າ (ພ້ອມກັບຫັກສິນຄ້າອອກຈາກສາງ)
 */
exports.delete_import = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳເຂົ້າ" 
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
            
            // 1. ດຶງລາຍລະອຽດການນຳເຂົ້າເພື່ອຫຼຸດຈຳນວນສິນຄ້າຄືນ
            const getDetailsQuery = `
                SELECT pro_id, qty FROM import_detail WHERE imp_id = ?
            `;
            
            connection_final.query(getDetailsQuery, [imp_id], (err, details) => {
                if (err) {
                    return connection_final.rollback(() => {
                        console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳເຂົ້າ:", err);
                        res.status(500).json({ 
                            "result_code": "500", 
                            "result": "ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳເຂົ້າ" 
                        });
                    });
                }
                
                // 2. ຫຼຸດຈຳນວນສິນຄ້າໃນສາງ
                const updateStockPromises = details.map(detail => {
                    return new Promise((resolve, reject) => {
                        const updateQuery = `
                            UPDATE products 
                            SET qty = GREATEST(0, qty - ?) 
                            WHERE proid = ?
                        `;
                        
                        connection_final.query(updateQuery, [detail.qty, detail.pro_id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                });
                
                Promise.all(updateStockPromises)
                    .then(() => {
                        // 3. ລຶບລາຍລະອຽດການນຳເຂົ້າ
                        const deleteDetailsQuery = "DELETE FROM import_detail WHERE imp_id = ?";
                        
                        connection_final.query(deleteDetailsQuery, [imp_id], (err) => {
                            if (err) {
                                return connection_final.rollback(() => {
                                    console.error("ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳເຂົ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳເຂົ້າ" 
                                    });
                                });
                            }
                            
                            // 4. ລຶບການນຳເຂົ້າ
                            const deleteImportQuery = "DELETE FROM import WHERE imp_id = ?";
                            
                            connection_final.query(deleteImportQuery, [imp_id], (err, result) => {
                                if (err) {
                                    return connection_final.rollback(() => {
                                        console.error("ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ" 
                                        });
                                    });
                                }
                                
                                if (result.affectedRows === 0) {
                                    return connection_final.rollback(() => {
                                        res.status(404).json({ 
                                            "result_code": "404", 
                                            "result": "ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ" 
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
                                        "result": "ລຶບການນຳເຂົ້າສຳເລັດແລ້ວ"
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