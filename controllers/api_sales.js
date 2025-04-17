// controllers/api_sales.js - Enhanced with more functionality
const mysql = require('mysql');
require("dotenv").config();
const connection_final = require("../components/connection_final");

/**
 * ສ້າງການຂາຍໃໝ່
 */
exports.insert_sales = (req, res, next) => {
    const { cus_id, emp_id, subtotal, pay, money_change, products } = req.body;

    // ຕວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ
    if (!cus_id || !emp_id || !subtotal || !pay || !money_change || !products) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing required parameters" 
        });
    }

    // ນຳໃຊ້ transaction ເພື່ອຮັບປະກັນຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ
    try {
        connection_final.getConnection((err, connection) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database connection error", 
                    "error": err.message 
                });
            }

            // ເລີ່ມ transaction
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "Transaction start error", 
                        "error": err.message 
                    });
                }

                // 1. ບັນທຶກຂໍ້ມູນການຂາຍຫຼັກ
                const saleQuery = `
                    INSERT INTO sale (cus_id, emp_id, date_sale, subtotal, pay, money_change)
                    VALUES (?, ?, NOW(), ?, ?, ?)
                `;
                
                connection.query(
                    saleQuery, 
                    [cus_id, emp_id, subtotal, pay, money_change], 
                    (err, saleResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("ຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນການຂາຍ:", err);
                                res.status(500).json({ 
                                    "result_code": "500", 
                                    "result": "Error inserting sale", 
                                    "error": err.message 
                                });
                            });
                        }
                        
                        const saleId = saleResult.insertId;
                        
                        // 2. ບັນທຶກລາຍລະອຽດສິນຄ້າທີ່ຂາຍ
                        const detailValues = products.map(product => [
                            saleId, 
                            product.proid, 
                            product.qty, 
                            product.price, 
                            product.total
                        ]);
                        
                        const detailQuery = `
                            INSERT INTO sale_detail (sale_id, proid, qty, price, total) 
                            VALUES ?
                        `;
                        
                        connection.query(detailQuery, [detailValues], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການບັນທຶກລາຍລະອຽດການຂາຍ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "Error inserting sale details", 
                                        "error": err.message 
                                    });
                                });
                            }
                            
                            // 3. ອັບເດດຈຳນວນສິນຄ້າໃນສາງ
                            let updateIndex = 0;
                            const updateNextStock = () => {
                                if (updateIndex >= products.length) {
                                    // ຖ້າອັບເດດທຸກລາຍການແລ້ວ, ໃຫ້ commit transaction
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການ commit transaction:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "Error committing transaction", 
                                                    "error": err.message 
                                                });
                                            });
                                        }
                                        
                                        connection.release();
                                        res.status(200).json({
                                            "result_code": "200",
                                            "result": "Insert sale success",
                                            "sale_id": saleId
                                        });
                                    });
                                    return;
                                }
                                
                                const product = products[updateIndex];
                                const updateQuery = `
                                    UPDATE products 
                                    SET qty = GREATEST(0, qty - ?) 
                                    WHERE proid = ?
                                `;
                                
                                connection.query(updateQuery, [product.qty, product.proid], (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສິນຄ້າ:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "Error updating product stock", 
                                                "error": err.message 
                                            });
                                        });
                                    }
                                    
                                    updateIndex++;
                                    updateNextStock();
                                });
                            };
                            
                            // ເລີ່ມອັບເດດສິນຄ້າລາຍການທຳອິດ
                            updateNextStock();
                        });
                    }
                );
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ດຶງຂໍ້ມູນການຂາຍທັງໝົດ
 */
exports.select_all_sales = (req, res, next) => {
    try {
        // ດຶງຂໍ້ມູນການຂາຍທັງໝົດພ້ອມຊື່ລູກຄ້າແລະພະນັກງານ
        const query = `
            SELECT s.sale_id, s.date_sale, s.subtotal, s.pay, s.money_change,
                   c.cus_name, c.cus_lname, 
                   CONCAT(c.cus_name, ' ', c.cus_lname) AS customer_name,
                   e.emp_name, e.emp_lname, 
                   CONCAT(e.emp_name, ' ', e.emp_lname) AS emp_name  
            FROM sale s
            LEFT JOIN customer c ON s.cus_id = c.cus_id
            LEFT JOIN employee e ON s.emp_id = e.emp_id
            ORDER BY s.sale_id DESC
        `;
        
        connection_final.query(query, (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການຂາຍ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database error", 
                    "error": err.message 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "sales_data": results
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ດຶງຂໍ້ມູນລາຍລະອຽດການຂາຍຕາມ sale_id
 */
exports.select_sale_details = (req, res, next) => {
    const { sale_id } = req.body;
    
    if (!sale_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing sale_id parameter" 
        });
    }
    
    try {
        // ດຶງຂໍ້ມູນລາຍລະອຽດການຂາຍພ້ອມຊື່ສິນຄ້າ
        const query = `
            SELECT sd.sale_d_id, sd.sale_id, sd.proid, sd.qty, sd.price, sd.total,
                   p.ProductName AS product_name
            FROM sale_detail sd
            LEFT JOIN products p ON sd.proid = p.proid
            WHERE sd.sale_id = ?
        `;
        
        connection_final.query(query, [sale_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການຂາຍ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database error", 
                    "error": err.message 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "sale_details": results
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ດຶງຂໍ້ມູນການຂາຍຕາມລະຫັດ
 */
exports.select_sale_by_id = (req, res, next) => {
    const { sale_id } = req.body;
    
    if (!sale_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing sale_id parameter" 
        });
    }
    
    try {
        const query = `
            SELECT s.sale_id, s.date_sale, s.subtotal, s.pay, s.money_change,
                   c.cus_id, c.cus_name, c.cus_lname, c.tel AS customer_tel,
                   e.emp_id, e.emp_name, e.emp_lname
            FROM sale s
            LEFT JOIN customer c ON s.cus_id = c.cus_id
            LEFT JOIN employee e ON s.emp_id = e.emp_id
            WHERE s.sale_id = ?
        `;
        
        connection_final.query(query, [sale_id], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການຂາຍຕາມລະຫັດ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database error", 
                    "error": err.message 
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    "result_code": "404",
                    "result": "Sale not found"
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "sale_info": results[0]
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ລຶບຂໍ້ມູນການຂາຍ (ຍົກເລີກການຂາຍ)
 */
exports.delete_sale = (req, res, next) => {
    const { sale_id } = req.body;
    
    if (!sale_id) {
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "Missing sale_id parameter" 
        });
    }
    
    try {
        connection_final.getConnection((err, connection) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database connection error", 
                    "error": err.message 
                });
            }
            
            // ເລີ່ມ transaction
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error("ຂໍ້ຜິດພາດໃນການເລີ່ມ transaction:", err);
                    return res.status(500).json({ 
                        "result_code": "500", 
                        "result": "Transaction start error",
                        "error": err.message
                    });
                }
                
                // 1. ດຶງຂໍ້ມູນລາຍລະອຽດການຂາຍກ່ອນລຶບ ເພື່ອເອົາຈຳນວນສິນຄ້າຄືນໄປໃສ່ສາງ
                const getDetailsQuery = `
                    SELECT proid, qty FROM sale_detail WHERE sale_id = ?
                `;
                
                connection.query(getDetailsQuery, [sale_id], (err, details) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("ຂໍ້ຜິດພາດໃນການດຶງລາຍລະອຽດການຂາຍ:", err);
                            res.status(500).json({ 
                                "result_code": "500", 
                                "result": "Error fetching sale details", 
                                "error": err.message 
                            });
                        });
                    }
                    
                    if (details.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(404).json({
                                "result_code": "404",
                                "result": "Sale not found or has no details"
                            });
                        });
                    }
                    
                    // 2. ອັບເດດສິນຄ້າໃນສາງ (ເພີ່ມກັບຄືນເທົ່າຈຳນວນທີ່ຂາຍໄປ)
                    let updateIndex = 0;
                    const updateNextStock = () => {
                        if (updateIndex >= details.length) {
                            // 3. ລຶບລາຍລະອຽດການຂາຍ
                            const deleteDetailsQuery = `
                                DELETE FROM sale_detail WHERE sale_id = ?
                            `;
                            
                            connection.query(deleteDetailsQuery, [sale_id], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("ຂໍ້ຜິດພາດໃນການລຶບລາຍລະອຽດການຂາຍ:", err);
                                        res.status(500).json({ 
                                            "result_code": "500", 
                                            "result": "Error deleting sale details", 
                                            "error": err.message 
                                        });
                                    });
                                }
                                
                                // 4. ລຶບຂໍ້ມູນການຂາຍຫຼັກ
                                const deleteSaleQuery = `
                                    DELETE FROM sale WHERE sale_id = ?
                                `;
                                
                                connection.query(deleteSaleQuery, [sale_id], (err, result) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("ຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນການຂາຍ:", err);
                                            res.status(500).json({ 
                                                "result_code": "500", 
                                                "result": "Error deleting sale", 
                                                "error": err.message 
                                            });
                                        });
                                    }
                                    
                                    if (result.affectedRows === 0) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(404).json({
                                                "result_code": "404",
                                                "result": "Sale not found"
                                            });
                                        });
                                    }
                                    
                                    // 5. ຢືນຢັນການລຶບຂໍ້ມູນທັງໝົດ (commit)
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error("ຂໍ້ຜິດພາດໃນການຢືນຢັນການລຶບຂໍ້ມູນ:", err);
                                                res.status(500).json({ 
                                                    "result_code": "500", 
                                                    "result": "Error committing transaction", 
                                                    "error": err.message 
                                                });
                                            });
                                        }
                                        
                                        connection.release();
                                        res.status(200).json({
                                            "result_code": "200",
                                            "result": "Sale deleted successfully"
                                        });
                                    });
                                });
                            });
                            return;
                        }
                        
                        const item = details[updateIndex];
                        const updateStockQuery = `
                            UPDATE products SET qty = qty + ? WHERE proid = ?
                        `;
                        
                        connection.query(updateStockQuery, [item.qty, item.proid], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("ຂໍ້ຜິດພາດໃນການອັບເດດສິນຄ້າ:", err);
                                    res.status(500).json({ 
                                        "result_code": "500", 
                                        "result": "Error updating product stock", 
                                        "error": err.message 
                                    });
                                });
                            }
                            
                            updateIndex++;
                            updateNextStock();
                        });
                    };
                    
                    // ເລີ່ມອັບເດດສິນຄ້າລາຍການທຳອິດ
                    updateNextStock();
                });
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ຄົ້ນຫາຂໍ້ມູນການຂາຍຕາມເງື່ອນໄຂຕ່າງໆ
 */
exports.search_sales = (req, res, next) => {
    let { keyword, start_date, end_date } = req.body;
    
    try {
        // ສ້າງເງື່ອນໄຂຄົ້ນຫາ
        let conditions = [];
        let params = [];
        
        if (keyword) {
            conditions.push(`(
                s.sale_id LIKE ? OR
                c.cus_name LIKE ? OR
                c.cus_lname LIKE ? OR
                e.emp_name LIKE ? OR
                e.emp_lname LIKE ?
            )`);
            
            const keywordParam = `%${keyword}%`;
            params.push(keywordParam, keywordParam, keywordParam, keywordParam, keywordParam);
        }
        
        if (start_date) {
            conditions.push(`s.date_sale >= ?`);
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push(`s.date_sale <= ?`);
            params.push(end_date);
        }
        
        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // ດຶງຂໍ້ມູນການຂາຍຕາມເງື່ອນໄຂ
        const query = `
            SELECT s.sale_id, s.date_sale, s.subtotal, s.pay, s.money_change,
                   c.cus_name, c.cus_lname, 
                   CONCAT(c.cus_name, ' ', c.cus_lname) AS customer_name,
                   e.emp_name, e.emp_lname, 
                   CONCAT(e.emp_name, ' ', e.emp_lname) AS emp_name  
            FROM sale s
            LEFT JOIN customer c ON s.cus_id = c.cus_id
            LEFT JOIN employee e ON s.emp_id = e.emp_id
            ${whereClause}
            ORDER BY s.sale_id DESC
        `;
        
        connection_final.query(query, params, (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການຄົ້ນຫາຂໍ້ມູນການຂາຍ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database error", 
                    "error": err.message 
                });
            }
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "sales_data": results
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};

/**
 * ດຶງສະຫຼຸບຍອດຂາຍປະຈຳວັນ
 */
exports.get_daily_sales_summary = (req, res, next) => {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
        const query = `
            SELECT 
                COUNT(sale_id) AS total_sales,
                SUM(subtotal) AS total_amount,
                DATE(date_sale) AS sale_date
            FROM sale
            WHERE DATE(date_sale) = ?
            GROUP BY DATE(date_sale)
        `;
        
        connection_final.query(query, [targetDate], (err, results) => {
            if (err) {
                console.error("ຂໍ້ຜິດພາດໃນການດຶງສະຫຼຸບຍອດຂາຍປະຈຳວັນ:", err);
                return res.status(500).json({ 
                    "result_code": "500", 
                    "result": "Database error", 
                    "error": err.message 
                });
            }
            
            // ຖ້າບໍ່ມີຂໍ້ມູນ, ສົ່ງຄ່າເປັນ 0
            const summary = results.length > 0 ? results[0] : {
                total_sales: 0,
                total_amount: 0,
                sale_date: targetDate
            };
            
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "summary": summary
            });
        });
    } catch (error) {
        console.error("ຂໍ້ຜິດພາດທົ່ວໄປ:", error);
        res.status(500).json({ 
            "result_code": "500", 
            "result": "General error", 
            "error": error.message 
        });
    }
};