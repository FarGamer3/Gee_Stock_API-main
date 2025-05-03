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
        // ດຶງລາຍການສັ່ງຊື້ທີ່ຍັງບໍ່ໄດ້ນຳເຂົ້າ ຫຼື ນຳເຂົ້າແລ້ວແຕ່ຖືກຍົກເລີກ
        // ແລະ ບໍ່ໃຫ້ລວມລາຍການທີ່ມີການນຳເຂົ້າທີ່ກຳລັງຢູ່ໃນສະຖານະ 'Pending'
        const query = `
            SELECT DISTINCT o.order_id, o.order_date, s.sup_name as supplier, e.emp_name as employee 
            FROM orders o 
            LEFT JOIN supplier s ON o.sup_id = s.sup_id 
            LEFT JOIN employee e ON o.emp_id = e.emp_id 
            WHERE o.order_id NOT IN (
                SELECT DISTINCT order_id 
                FROM import 
                WHERE status IN ('Pending', 'Completed')
            )
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
    
    const { emp_id, order_id, imp_date, total_price, items } = req.body;
    
    // ບໍ່ຮັບຄ່າ status ຈາກ frontend ອີກຕໍ່ໄປ, ໃຊ້ 'Pending' ສະເໝີ
    const status = 'Pending';
    
    if (!emp_id || !order_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
        });
    }
    
    try {
        connection_final.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", connectionErr);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່" 
                });
            }
        
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction" 
                    });
                }
                
                // 1. ເພີ່ມຂໍ້ມູນການນຳເຂົ້າລົງໃນຕາຕະລາງ import ໂດຍບໍ່ອັບເດດສິນຄ້າ
                const importQuery = `
                    INSERT INTO import (emp_id, order_id, imp_date, total_price, status) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                connection.query(
                    importQuery, 
                    [emp_id, order_id, imp_date || new Date(), total_price, status], 
                    (err, importResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
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
                        
                        connection.query(detailQuery, [detailValues], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳເຂົ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການເພີ່ມລາຍລະອຽດການນຳເຂົ້າ",
                                        "error": err.message
                                    });
                                });
                            }
                            
                            // ບໍ່ອັບເດດສິນຄ້າທັນທີ, ລໍຖ້າການອະນຸມັດກ່ອນ
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
                                    "result": "ສ້າງການນຳເຂົ້າສຳເລັດແລ້ວ (ລໍຖ້າອະນຸມັດ)",
                                    "imp_id": impId
                                });
                            });
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
        connection_final.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", connectionErr);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່" 
                });
            }
            
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction" 
                    });
                }
                
                // ອັບເດດສະຖານະກ່ອນ
                const updateStatusQuery = "UPDATE import SET status = ? WHERE imp_id = ?";
                
                connection.query(updateStatusQuery, [status, imp_id], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະ:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "ຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະ" 
                            });
                        });
                    }
                    
                    // ຖ້າສະຖານະເປັນ Completed, ໃຫ້ອັບເດດສິນຄ້າ
                    if (status === 'Completed') {
                        // ດຶງລາຍລະອຽດການນຳເຂົ້າ
                        const getDetailsQuery = `
                            SELECT pro_id, qty FROM import_detail WHERE imp_id = ?
                        `;
                        
                        connection.query(getDetailsQuery, [imp_id], (err, details) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດ" 
                                    });
                                });
                            }
                            
                            // ອັບເດດສິນຄ້າແຕ່ລະລາຍການ
                            let updateIndex = 0;
                            
                            const updateNextStock = () => {
                                if (updateIndex >= details.length) {
                                    // ສຳເລັດການອັບເດດທັງໝົດ
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການຢືນຢັນ:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "ຂໍ້ຜິດພາດໃນການຢືນຢັນ" 
                                                });
                                            });
                                        }
                                        
                                        connection.release();
                                        res.status(200).json({
                                            "result_code": "200",
                                            "result": "ອະນຸມັດການນຳເຂົ້າແລະອັບເດດສິນຄ້າສຳເລັດແລ້ວ"
                                        });
                                    });
                                    return;
                                }
                                
                                const item = details[updateIndex];
                                
                                connection.query(
                                    "UPDATE products SET qty = qty + ? WHERE proid = ?", 
                                    [item.qty, item.pro_id], 
                                    (err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສິນຄ້າ:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "ຂໍ້ຜິດພາດໃນການອັບເດດສິນຄ້າ",
                                                    "error": err.message
                                                });
                                            });
                                        }
                                        
                                        updateIndex++;
                                        updateNextStock();
                                    }
                                );
                            };
                            
                            updateNextStock();
                        });
                    } else {
                        // ຖ້າບໍ່ແມ່ນ Completed, ບໍ່ຕ້ອງອັບເດດສິນຄ້າ
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການຢືນຢັນ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການຢືນຢັນ" 
                                    });
                                });
                            }
                            
                            connection.release();
                            res.status(200).json({
                                "result_code": "200",
                                "result": "ອັບເດດສະຖານະສຳເລັດແລ້ວ"
                            });
                        });
                    }
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

/**
 * ລຶບການນຳເຂົ້າ (ພ້ອມກັບຫັກສິນຄ້າອອກຈາກສາງ)
 */
// controllers/api_import.js
exports.delete_import = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ບໍ່ມີລະຫັດການນຳເຂົ້າ" 
        });
    }
    
    try {
        // ໃຊ້ connection pool ແທນ connection ໂດຍກົງ
        connection_final.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", connectionErr);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ" 
                });
            }
            
            // ເລີ່ມການເຮັດ transaction
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
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
                
                connection.query(getDetailsQuery, [imp_id], (err, details) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳເຂົ້າ:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການນຳເຂົ້າ" 
                            });
                        });
                    }
                    
                    // ຖ້າບໍ່ມີລາຍລະອຽດ, ໃຫ້ລຶບການນຳເຂົ້າໄດ້ເລີຍ
                    if (!details || details.length === 0) {
                        // ລຶບການນຳເຂົ້າໂດຍກົງ
                        const deleteImportQuery = "DELETE FROM import WHERE imp_id = ?";
                        
                        connection.query(deleteImportQuery, [imp_id], (err, result) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ" 
                                    });
                                });
                            }
                            
                            // Commit transaction
                            connection.commit(err => {
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
                                    "result": "ລຶບການນຳເຂົ້າສຳເລັດແລ້ວ"
                                });
                            });
                        });
                        return;
                    }
                    
                    // 2. ອັບເດດຈຳນວນສິນຄ້າໃນສາງແບບ sequential
                    let updateIndex = 0;
                    
                    const updateNextStock = () => {
                        if (updateIndex >= details.length) {
                            // 3. ລຶບລາຍລະອຽດການນຳເຂົ້າ
                            const deleteDetailsQuery = "DELETE FROM import_detail WHERE imp_id = ?";
                            
                            connection.query(deleteDetailsQuery, [imp_id], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳເຂົ້າ:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການນຳເຂົ້າ" 
                                        });
                                    });
                                }
                                
                                // 4. ລຶບການນຳເຂົ້າ
                                const deleteImportQuery = "DELETE FROM import WHERE imp_id = ?";
                                
                                connection.query(deleteImportQuery, [imp_id], (err, result) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "ຂໍ້ຜິດພາດໃນການລຶບການນຳເຂົ້າ" 
                                            });
                                        });
                                    }
                                    
                                    if (result.affectedRows === 0) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(404).json({ 
                                                "result_code": "404", 
                                                "result": "ບໍ່ພົບຂໍ້ມູນການນຳເຂົ້າ" 
                                            });
                                        });
                                    }
                                    
                                    // ຢືນຢັນການເຮັດ transaction
                                    connection.commit(err => {
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
                                            "result": "ລຶບການນຳເຂົ້າສຳເລັດແລ້ວ"
                                        });
                                    });
                                });
                            });
                            return;
                        }
                        
                        const detail = details[updateIndex];
                        const updateQuery = `
                            UPDATE products 
                            SET qty = GREATEST(0, qty - ?) 
                            WHERE proid = ?
                        `;
                        
                        connection.query(updateQuery, [detail.qty, detail.pro_id], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "ຂໍ້ຜິດພາດໃນການອັບເດດຈຳນວນສິນຄ້າ" 
                                    });
                                });
                            }
                            
                            updateIndex++;
                            updateNextStock();
                        });
                    };
                    
                    // ເລີ່ມອັບເດດຈຳນວນສິນຄ້າ
                    updateNextStock();
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