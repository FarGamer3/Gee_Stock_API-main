const mysql = require('mysql');
require("dotenv").config();
const connection_final = require("../components/connection_final");

/**
 * ຟັງຊັນດຶງຂໍ້ມູນການນຳເຂົ້າສິນຄ້າທັງໝົດ
 */
exports.select_all_imports = (req, res, next) => {
    try {
        let sql = `
            SELECT i.imp_id, i.emp_id, i.order_id, i.imp_date, i.total_price, i.status,
                   e.emp_name, o.order_date
            FROM import i
            LEFT JOIN employee e ON i.emp_id = e.emp_id
            LEFT JOIN orders o ON i.order_id = o.order_id
            ORDER BY i.imp_id DESC
        `;

        connection_final.query(sql, [], (err, results) => {
            if (err) {
                console.log("Error selecting imports:", err);
                return res.status(400).json({ result: "Database Error" });
            }
            
            res.status(200).json({
                result_code: "200",
                result: "Success",
                imports: results
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};

/**
 * ຟັງຊັນດຶງຂໍ້ມູນລາຍລະອຽດຂອງການນຳເຂົ້າສິນຄ້າ
 */
exports.select_import_details = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ result: "Missing imp_id parameter" });
    }
    
    try {
        let sql = `
            SELECT id.imp_d_id, id.imp_id, id.pro_id as proid, id.qty, id.cost_price,
                   p.ProductName, (id.qty * id.cost_price) as subtotal,
                   i.imp_date, i.order_id, i.status, e.emp_name
            FROM import_detail id
            LEFT JOIN products p ON id.pro_id = p.proid
            LEFT JOIN import i ON id.imp_id = i.imp_id
            LEFT JOIN employee e ON i.emp_id = e.emp_id
            WHERE id.imp_id = ?
        `;
        
        connection_final.query(sql, [imp_id], (err, results) => {
            if (err) {
                console.log("Error selecting import details:", err);
                return res.status(400).json({ result: "Database Error" });
            }
            
            res.status(200).json({
                result_code: "200",
                result: "Success",
                import_details: results
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};

/**
 * ຟັງຊັນສ້າງລາຍການນຳເຂົ້າສິນຄ້າໃໝ່
 */
exports.create_import = (req, res, next) => {
    const { emp_id, order_id, imp_date, total_price, status, items } = req.body;
    
    if (!emp_id || !order_id || !imp_date || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            result_code: "400", 
            result: "Missing required parameters"
        });
    }
    
    try {
        // Start a transaction
        connection_final.beginTransaction(err => {
            if (err) {
                console.log("Error starting transaction:", err);
                return res.status(500).json({
                    result_code: "500",
                    result: "Transaction error",
                    error: err.message
                });
            }
            
            // Insert into import table
            const importSql = `INSERT INTO import (emp_id, order_id, imp_date, total_price, status) 
                              VALUES (?, ?, ?, ?, ?)`;
            
            connection_final.query(
                importSql,
                [emp_id, order_id, imp_date, total_price || 0, status || 'Completed'],
                (err, importResult) => {
                    if (err) {
                        return connection_final.rollback(() => {
                            console.log("Error inserting import:", err);
                            res.status(500).json({
                                result_code: "500",
                                result: "Database Error",
                                error: err.message
                            });
                        });
                    }
                    
                    const imp_id = importResult.insertId;
                    
                    // Prepare import detail values
                    const detailValues = [];
                    const productUpdates = [];
                    
                    for (const item of items) {
                        if (item.proid && item.qty && item.cost_price) {
                            detailValues.push([imp_id, item.proid, item.qty, item.cost_price]);
                            productUpdates.push({
                                proid: item.proid,
                                qty: item.qty
                            });
                        }
                    }
                    
                    if (detailValues.length === 0) {
                        return connection_final.rollback(() => {
                            res.status(400).json({
                                result_code: "400",
                                result: "No valid items provided"
                            });
                        });
                    }
                    
                    // Insert import details
                    const detailSql = `INSERT INTO import_detail (imp_id, pro_id, qty, cost_price) 
                                      VALUES ?`;
                    
                    connection_final.query(detailSql, [detailValues], (err, detailResult) => {
                        if (err) {
                            return connection_final.rollback(() => {
                                console.log("Error inserting import details:", err);
                                res.status(500).json({
                                    result_code: "500",
                                    result: "Database Error",
                                    error: err.message
                                });
                            });
                        }
                        
                        // Update product quantities
                        const updateProductPromises = productUpdates.map(product => {
                            return new Promise((resolve, reject) => {
                                const updateSql = `UPDATE products SET qty = qty + ? WHERE proid = ?`;
                                connection_final.query(updateSql, [product.qty, product.proid], (err, result) => {
                                    if (err) reject(err);
                                    else resolve(result);
                                });
                            });
                        });
                        
                        Promise.all(updateProductPromises)
                            .then(() => {
                                // Commit transaction
                                connection_final.commit(err => {
                                    if (err) {
                                        return connection_final.rollback(() => {
                                            console.log("Error committing transaction:", err);
                                            res.status(500).json({
                                                result_code: "500",
                                                result: "Transaction Error",
                                                error: err.message
                                            });
                                        });
                                    }
                                    
                                    res.status(201).json({
                                        result_code: "201",
                                        result: "Import created successfully",
                                        imp_id: imp_id
                                    });
                                });
                            })
                            .catch(err => {
                                connection_final.rollback(() => {
                                    console.log("Error updating product quantities:", err);
                                    res.status(500).json({
                                        result_code: "500",
                                        result: "Product Update Error",
                                        error: err.message
                                    });
                                });
                            });
                    });
                }
            );
        });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({
            result_code: "500",
            result: "Server Error",
            error: err.message
        });
    }
};

/**
 * ຟັງຊັນດຶງຂໍ້ມູນລາຍການສັ່ງຊື້ທີ່ຍັງບໍ່ໄດ້ນຳເຂົ້າ
 */
exports.get_pending_orders = (req, res, next) => {
    try {
        // Get orders that haven't been imported yet
        let sql = `
            SELECT o.order_id, o.order_date, s.sup_name as supplier, e.emp_name as employee 
            FROM orders o 
            LEFT JOIN supplier s ON o.sup_id = s.sup_id 
            LEFT JOIN employee e ON o.emp_id = e.emp_id
            WHERE o.order_id NOT IN (
                SELECT DISTINCT order_id FROM import WHERE order_id IS NOT NULL
            )
            ORDER BY o.order_date DESC
        `;
        
        connection_final.query(sql, [], (err, results) => {
            if (err) {
                console.log("Error selecting pending orders:", err);
                return res.status(400).json({ result: "Database Error" });
            }
            
            res.status(200).json({
                result_code: "200",
                result: "Success",
                pending_orders: results
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};

/**
 * ຟັງຊັນດຶງຂໍ້ມູນລາຍການສິນຄ້າໃນລາຍການສັ່ງຊື້
 */
exports.get_order_products = (req, res, next) => {
    const { order_id } = req.body;
    
    if (!order_id) {
        return res.status(400).json({ result: "Missing order_id parameter" });
    }
    
    try {
        let sql = `
            SELECT od.order_d_id, od.proid, od.qty, 
                   p.ProductName, p.cost_price,
                   (od.qty * p.cost_price) as subtotal
            FROM order_detail od
            LEFT JOIN products p ON od.proid = p.proid
            WHERE od.order_id = ?
        `;
        
        connection_final.query(sql, [order_id], (err, results) => {
            if (err) {
                console.log("Error selecting order products:", err);
                return res.status(400).json({ result: "Database Error" });
            }
            
            res.status(200).json({
                result_code: "200",
                result: "Success",
                order_products: results
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};

/**
 * ຟັງຊັນອັບເດດສະຖານະການນຳເຂົ້າສິນຄ້າ
 */
exports.update_import_status = (req, res, next) => {
    const { imp_id, status } = req.body;
    
    if (!imp_id || !status) {
        return res.status(400).json({ result: "Missing required parameters" });
    }
    
    try {
        const sql = `UPDATE import SET status = ? WHERE imp_id = ?`;
        
        connection_final.query(sql, [status, imp_id], (err, result) => {
            if (err) {
                console.log("Error updating import status:", err);
                return res.status(400).json({ result: "Database Error" });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ result: "Import not found" });
            }
            
            res.status(200).json({
                result_code: "200",
                result: "Import status updated successfully"
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};

/**
 * ຟັງຊັນລຶບລາຍການນຳເຂົ້າສິນຄ້າ
 */
exports.delete_import = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ result: "Missing imp_id parameter" });
    }
    
    try {
        // Start a transaction
        connection_final.beginTransaction(err => {
            if (err) {
                console.log("Error starting transaction:", err);
                return res.status(500).json({
                    result_code: "500",
                    result: "Transaction error",
                    error: err.message
                });
            }
            
            // First get import details to update product quantities
            const detailSql = `SELECT pro_id as proid, qty FROM import_detail WHERE imp_id = ?`;
            
            connection_final.query(detailSql, [imp_id], (err, details) => {
                if (err) {
                    return connection_final.rollback(() => {
                        console.log("Error getting import details:", err);
                        res.status(500).json({
                            result_code: "500",
                            result: "Database Error",
                            error: err.message
                        });
                    });
                }
                
                // Prepare product updates to revert quantity changes
                const productUpdates = details.map(detail => ({
                    proid: detail.proid,
                    qty: detail.qty
                }));
                
                // Delete import details
                const deleteDetailSql = `DELETE FROM import_detail WHERE imp_id = ?`;
                
                connection_final.query(deleteDetailSql, [imp_id], (err, detailResult) => {
                    if (err) {
                        return connection_final.rollback(() => {
                            console.log("Error deleting import details:", err);
                            res.status(500).json({
                                result_code: "500",
                                result: "Database Error",
                                error: err.message
                            });
                        });
                    }
                    
                    // Delete import
                    const deleteImportSql = `DELETE FROM import WHERE imp_id = ?`;
                    
                    connection_final.query(deleteImportSql, [imp_id], (err, importResult) => {
                        if (err) {
                            return connection_final.rollback(() => {
                                console.log("Error deleting import:", err);
                                res.status(500).json({
                                    result_code: "500",
                                    result: "Database Error",
                                    error: err.message
                                });
                            });
                        }
                        
                        // Update product quantities (subtract the imported quantities)
                        const updateProductPromises = productUpdates.map(product => {
                            return new Promise((resolve, reject) => {
                                const updateSql = `UPDATE products SET qty = qty - ? WHERE proid = ?`;
                                connection_final.query(updateSql, [product.qty, product.proid], (err, result) => {
                                    if (err) reject(err);
                                    else resolve(result);
                                });
                            });
                        });
                        
                        Promise.all(updateProductPromises)
                            .then(() => {
                                // Commit transaction
                                connection_final.commit(err => {
                                    if (err) {
                                        return connection_final.rollback(() => {
                                            console.log("Error committing transaction:", err);
                                            res.status(500).json({
                                                result_code: "500",
                                                result: "Transaction Error",
                                                error: err.message
                                            });
                                        });
                                    }
                                    
                                    res.status(200).json({
                                        result_code: "200",
                                        result: "Import deleted successfully"
                                    });
                                });
                            })
                            .catch(err => {
                                connection_final.rollback(() => {
                                    console.log("Error updating product quantities:", err);
                                    res.status(500).json({
                                        result_code: "500",
                                        result: "Product Update Error",
                                        error: err.message
                                    });
                                });
                            });
                    });
                });
            });
        });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({
            result_code: "500",
            result: "Server Error",
            error: err.message
        });
    }
};