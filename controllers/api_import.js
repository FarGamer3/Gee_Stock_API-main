// controllers/api_import.js
const mysql = require('mysql');
require("dotenv").config();
const connection_final = require("../components/connection_final");

/**
 * Select all imports
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
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database Error" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "imports": results
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};

/**
 * Get import details for a specific import
 */
exports.select_import_details = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing import ID" 
        });
    }
    
    try {
        const query = `
            SELECT id.imp_d_id, id.imp_id, id.qty, id.cost_price, 
                  (id.qty * id.cost_price) as subtotal,
                   p.proid, p.ProductName
            FROM import_detail id
            LEFT JOIN products p ON id.pro_id = p.proid
            WHERE id.imp_id = ?
        `;
        
        connection_final.query(query, [imp_id], (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database Error" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "import_details": results
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};

/**
 * Get pending orders
 */
exports.get_pending_orders = (req, res, next) => {
    try {
        // Query to get orders that haven't been fully imported yet
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
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database Error" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "pending_orders": results
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};

/**
 * Get products for a specific order
 */
exports.get_order_products = (req, res, next) => {
    const { order_id } = req.body;
    
    if (!order_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing order ID" 
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
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database Error" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "order_products": results
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};

/**
 * Create a new import with items
 */
exports.create_import = (req, res, next) => {
    console.log("Received import request:", JSON.stringify(req.body));
    
    const { emp_id, order_id, imp_date, status, total_price, items } = req.body;
    
    // Validate required fields
    if (!emp_id || !order_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing required data" 
        });
    }
    
    try {
        // Start a transaction
        connection_final.beginTransaction(err => {
            if (err) {
                console.error("Transaction Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Transaction Error" 
                });
            }
            
            // 1. Insert into import table
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
                            console.error("Import Insert Error:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "Import Insert Error",
                                "error": err.message
                            });
                        });
                    }
                    
                    const impId = importResult.insertId;
                    
                    // 2. Insert import details
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
                                console.error("Import Detail Insert Error:", err);
                                res.status(500).json({ 
                                    "result_code": "500", 
                                    "result": "Import Detail Insert Error",
                                    "error": err.message
                                });
                            });
                        }
                        
                        // 3. Update product stock
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
                                // Commit the transaction
                                connection_final.commit(err => {
                                    if (err) {
                                        return connection_final.rollback(() => {
                                            console.error("Commit Error:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "Commit Error" 
                                            });
                                        });
                                    }
                                    
                                    // Success response
                                    res.status(200).json({
                                        "result_code": "200",
                                        "result": "Import created successfully",
                                        "imp_id": impId
                                    });
                                });
                            })
                            .catch(err => {
                                connection_final.rollback(() => {
                                    console.error("Stock Update Error:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "Stock Update Error",
                                        "error": err.message
                                    });
                                });
                            });
                    });
                }
            );
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error",
            "error": error.message
        });
    }
};

/**
 * Update import status
 */
exports.update_import_status = (req, res, next) => {
    const { imp_id, status } = req.body;
    
    if (!imp_id || !status) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing required parameters" 
        });
    }
    
    try {
        const query = "UPDATE import SET status = ? WHERE imp_id = ?";
        
        connection_final.query(query, [status, imp_id], (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database Error" 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    "result_code": "404", 
                    "result": "Import not found" 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Status updated successfully"
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};

/**
 * Delete an import
 */
exports.delete_import = (req, res, next) => {
    const { imp_id } = req.body;
    
    if (!imp_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing import ID" 
        });
    }
    
    try {
        // Start transaction
        connection_final.beginTransaction(err => {
            if (err) {
                console.error("Transaction Error:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Transaction Error" 
                });
            }
            
            // 1. Get import details to reverse stock changes
            const getDetailsQuery = `
                SELECT pro_id, qty FROM import_detail WHERE imp_id = ?
            `;
            
            connection_final.query(getDetailsQuery, [imp_id], (err, details) => {
                if (err) {
                    return connection_final.rollback(() => {
                        console.error("Get Details Error:", err);
                        res.status(500).json({ 
                            "result_code": "500", 
                            "result": "Get Details Error" 
                        });
                    });
                }
                
                // 2. Reverse stock changes
                const updateStockPromises = details.map(detail => {
                    return new Promise((resolve, reject) => {
                        const updateQuery = `
                            UPDATE products 
                            SET qty = qty - ? 
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
                        // 3. Delete import details
                        const deleteDetailsQuery = "DELETE FROM import_detail WHERE imp_id = ?";
                        
                        connection_final.query(deleteDetailsQuery, [imp_id], (err) => {
                            if (err) {
                                return connection_final.rollback(() => {
                                    console.error("Delete Details Error:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "Delete Details Error" 
                                    });
                                });
                            }
                            
                            // 4. Delete import
                            const deleteImportQuery = "DELETE FROM import WHERE imp_id = ?";
                            
                            connection_final.query(deleteImportQuery, [imp_id], (err, result) => {
                                if (err) {
                                    return connection_final.rollback(() => {
                                        console.error("Delete Import Error:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "Delete Import Error" 
                                        });
                                    });
                                }
                                
                                if (result.affectedRows === 0) {
                                    return connection_final.rollback(() => {
                                        res.status(404).json({ 
                                            "result_code": "404", 
                                            "result": "Import not found" 
                                        });
                                    });
                                }
                                
                                // Commit the transaction
                                connection_final.commit(err => {
                                    if (err) {
                                        return connection_final.rollback(() => {
                                            console.error("Commit Error:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "Commit Error" 
                                            });
                                        });
                                    }
                                    
                                    // Success response
                                    res.status(200).json({
                                        "result_code": "200",
                                        "result": "Import deleted successfully"
                                    });
                                });
                            });
                        });
                    })
                    .catch(err => {
                        connection_final.rollback(() => {
                            console.error("Stock Update Error:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "Stock Update Error" 
                            });
                        });
                    });
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "Server Error" 
        });
    }
};