const mysql = require('mysql');
require("dotenv").config();
const connection_final= require("../components/connection_final");



//************************************************** Order ************************************************************
exports.select_all_order = (req, res, next) => {
    try {
        connection_final.query(
            'SELECT DISTINCT o.order_id, o.order_date, s.sup_name as supplier, e.emp_name as employee FROM orders o LEFT JOIN supplier s ON o.sup_id = s.sup_id LEFT JOIN employee e ON o.emp_id = e.emp_id ORDER BY o.order_id DESC',
            [],
            (err, results, fields) => {
                if (err) {
                    console.log("Error select data from the database", err);
                    return res.status(400).send();
                } else {
                    let _allUser = results
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "user_info": _allUser,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

// Improved insert_order function that properly handles the frontend request
exports.insert_order = (req, res, next) => {
    console.log("ໄດ້ຮັບຂໍ້ມູນການສັ່ງຊື້:", JSON.stringify(req.body));
    
    const { sup_id, emp_id, order_date, items } = req.body;
    
    // ກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ
    if (!sup_id || !emp_id || !items || !Array.isArray(items) || items.length === 0) {
        console.log("ຂໍ້ມູນບໍ່ຖືກຕ້ອງ:", req.body);
        return res.status(400).json({ 
            "result_code": "400", 
            "result": "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" 
        });
    }
    
    try {
        // ເພີ່ມຂໍ້ມູນໃສ່ຕາຕະລາງ orders
        const orderQuery = 'INSERT INTO orders (sup_id, emp_id, order_date) VALUES (?, ?, ?)';
        connection_final.query(
            orderQuery,
            [sup_id, emp_id, order_date || new Date().toISOString().split('T')[0]],
            (err, orderResult) => {
                if (err) {
                    console.log("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນການສັ່ງຊື້:", err);
                    return res.status(500).json({
                        "result_code": "500",
                        "result": "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ",
                        "error": err.message
                    });
                }
                
                const order_id = orderResult.insertId;
                console.log("ສ້າງການສັ່ງຊື້ຫມາຍເລກ:", order_id);
                
                // ກະກຽມຂໍ້ມູນລາຍລະອຽດການສັ່ງຊື້
                const orderDetailsValues = [];
                for (const item of items) {
                    if (item.proid && item.qty) {
                        orderDetailsValues.push([order_id, item.proid, item.qty]);
                    }
                }
                
                console.log("ກຳລັງບັນທຶກລາຍລະອຽດການສັ່ງຊື້:", orderDetailsValues);
                
                if (orderDetailsValues.length === 0) {
                    return res.status(200).json({
                        "result_code": "200",
                        "result": "ສ້າງການສັ່ງຊື້ສຳເລັດແຕ່ບໍ່ມີລາຍລະອຽດສິນຄ້າ",
                        "order_id": order_id
                    });
                }
                
                // ບັນທຶກລາຍລະອຽດການສັ່ງຊື້
                const detailQuery = 'INSERT INTO order_detail (order_id, proid, qty) VALUES ?';
                connection_final.query(
                    detailQuery,
                    [orderDetailsValues],
                    (detailErr, detailResults) => {
                        if (detailErr) {
                            console.log("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກລາຍລະອຽດການສັ່ງຊື້:", detailErr);
                            return res.status(500).json({
                                "result_code": "500",
                                "result": "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກລາຍລະອຽດການສັ່ງຊື້",
                                "error": detailErr.message
                            });
                        }
                        
                        console.log("ບັນທຶກລາຍລະອຽດການສັ່ງຊື້ສຳເລັດ");
                        res.status(200).json({
                            "result_code": "200",
                            "result": "ບັນທຶກການສັ່ງຊື້ສຳເລັດ",
                            "order_id": order_id
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.log("ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ:", err);
        return res.status(500).json({
            "result_code": "500",
            "result": "ເກີດຂໍ້ຜິດພາດໃນລະບົບ",
            "error": err.message
        });
    }
};
exports.update_order = (req, res, next) => {
    let { order_id, sup_id, emp_id, order_date } = req.body;
    if (!order_id ||!sup_id ||!emp_id ||!order_date ) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        connection_final.query(
            'UPDATE orders SET sup_id = ?, emp_id = ?, order_date = ? WHERE order_id = ?',
            [sup_id, emp_id, order_date, order_id],
            (err, results, fields) => {
                if (err) {
                    console.log("Error update data to the database", err);
                    return res.status(400).send();
                } else {
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Update Success",
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

exports.delete_order = (req, res, next) => {
    let { order_id } = req.body;
    if (!order_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        // First delete order details to maintain referential integrity
        connection_final.query(
            'DELETE FROM order_detail WHERE order_id = ?',
            [order_id],
            (detailErr, detailResults) => {
                if (detailErr) {
                    console.log("Error deleting order details:", detailErr);
                    return res.status(400).json({
                        "result_code": "400",
                        "result": "Failed to delete order details",
                        "error": detailErr.message
                    });
                }
                
                // Then delete the order itself
                connection_final.query(
                    'DELETE FROM orders WHERE order_id = ?',
                    [order_id],
                    (err, results) => {
                        if (err) {
                            console.log("Error deleting order:", err);
                            return res.status(400).json({
                                "result_code": "400",
                                "result": "Failed to delete order",
                                "error": err.message
                            });
                        }
                        
                        res.status(200).json({
                            "result_code": "200",
                            "result": "Delete Success",
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}




exports.update_order = (req, res, next) => {
    let { order_id, sup_id, emp_id, order_date } = req.body;
    if (!order_id ||!sup_id ||!emp_id ||!order_date ) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        connection_final.query(
            'UPDATE orders SET sup_id = ?, emp_id = ?, order_date = ? WHERE order_id = ?',
            [sup_id, emp_id, order_date, order_id],
            (err, results, fields) => {
                if (err) {
                    console.log("Error update data to the database", err);
                    return res.status(400).send();
                } else {
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Update Success",
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

exports.delete_order = (req, res, next) => {
    let { order_id } = req.body;
    if (!order_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        connection_final.query(
            'DELETE FROM orders WHERE order_id = ?',
            [order_id],
            (err, results, fields) => {
                if (err) {
                    console.log("Error delete data from the database", err);
                    return res.status(400).send();
                } else {
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Delete Success",
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}


//**************************************** Order Details ******************************************************************************


exports.select_all_order_detail = (req, res, next) => {
    try {
        connection_final.query(
            `SELECT od.order_d_id, p.ProductName, od.order_id, od.qty FROM order_detail od
            LEFT JOIN products p ON od.proid = p.proid`,
            [],
            (err, results, fields) => {
                if (err) {
                    console.log("Error select data from the database", err);
                    return res.status(400).send();
                } else {
                    let _allUser = results
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "user_info": _allUser,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

exports.select_order_detail_with_orderid = (req, res, next) => {
    let _data = req.body;
    let _order_id = _data.order_id;
    if (typeof _order_id != 'undefined') {
        try {
            connection_final.query(
                `SELECT od.order_d_id, p.ProductName, od.order_id, od.qty 
                FROM order_detail od
                LEFT JOIN products p ON od.proid = p.proid 
                WHERE od.order_id = ?`,
                [_order_id],
                (err, results, fields) => {
                    if (err) {
                        console.log("Error selecting order details:", err);
                        return res.status(400).json({
                            "result_code": "400",
                            "result": "Error fetching order details",
                            "error": err.message
                        });
                    } else {
                        console.log("Order details for ID", _order_id, ":", results);
                        res.status(200).json({
                            "result_code": "200",
                            "result": "Success",
                            "user_info": results,
                        });
                    }
                }
            )
        } catch (err) {
            console.log("Server error:", err);
            return res.status(500).json({
                "result_code": "500",
                "result": "Server error",
                "error": err.message
            });
        }
    } else {
        res.status(404).json({ "result": "Incorrect Parameter" });
    }
}

exports.insert_order_detail = (req, res, next) => {
    let { order_id, proid, qty } = req.body;
    if (!order_id || !proid || !qty) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        connection_final.query(
            'INSERT INTO order_detail (order_id, proid, qty) VALUES (?,?,?)',
            [order_id, proid, qty],
            (err, results, fields) => {
                if (err) {
                    console.log("Error insert data to the database", err);
                    return res.status(400).send();
                } else {
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "order_detail_id": results.insertId,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}



exports.select_order_detail_with_orderid = (req, res, next) => {
    let _data = req.body;
    let _order_id = _data.order_id;
    if (typeof _order_id != 'undefined') {
        try {
            connection_final.query(
                `SELECT od.order_d_id, p.ProductName, od.order_id, od.qty FROM order_detail
                LEFT JOIN product p ON od.pro_id = p.pro_id where order_id =?`,
                [_order_id],
                (err, results, fields) => {
                    if (err) {
                        console.log("Error select data from the database", err);
                        return res.status(400).send();
                    } else {
                        let _userInfo = results
                        res.status(200).json({
                            "result_code": "200",
                            "result": "Success",
                            "user_info": _userInfo,
                        });
                    }
                }
            )
        } catch (err) {
            console.log(err);
            return res.status(500).send();
        }
    } else {
        res.status(404).json({ "result": "Incorrect Parameter" });
    }
}






// code chat

exports.select_orders = (req, res, next) => {
    try {
        let sql = `
            SELECT o.order_id, o.order_date, s.sup_name, e.emp_name,
                   od.proid, p.ProductName, od.qty
            FROM orders o
            JOIN suppliers s ON o.sup_id = s.sup_id
            JOIN employees e ON o.emp_id = e.emp_id
            JOIN order_detail od ON o.order_id = od.order_id
            JOIN products p ON od.proid = p.proid
        `;

        connection_final.query(sql, [], (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ "result": "Database Error" });
            }
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "orders": results
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "result": "Internal Server Error" });
    }
};



  
  



exports.update_orders = (req, res, next) => {
    let { order_id, sup_id, emp_id, order_date, products } = req.body;

    if (!order_id || !sup_id || !emp_id || !order_date || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ "result": "Missing required fields or products" });
    }

    try {
        // อัปเดตตาราง `orders`
        let updateOrderQuery = `UPDATE orders SET sup_id = ?, emp_id = ?, order_date = ? WHERE order_id = ?`;
        connection_final.query(updateOrderQuery, [sup_id, emp_id, order_date, order_id], (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ "result": "Database Error" });
            }

            // ลบ `order_detail` เก่า แล้วเพิ่มใหม่
            let deleteDetailQuery = `DELETE FROM order_detail WHERE order_id = ?`;
            connection_final.query(deleteDetailQuery, [order_id], (err, delResult) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ "result": "Database Error" });
                }

                let insertDetailQuery = `INSERT INTO order_detail (pro_id, order_id, qty) VALUES ?`;
                let detailValues = products.map(p => [p.pro_id, order_id, p.qty]);

                connection_final.query(insertDetailQuery, [detailValues], (err, detailResult) => {
                    if (err) {
                        console.error("Database Error:", err);
                        return res.status(500).json({ "result": "Database Error" });
                    }

                    res.status(200).json({
                        "result_code": "200",
                        "result": "Order Updated Successfully"
                    });
                });
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "result": "Internal Server Error" });
    }
};



exports.delete_orders = (req, res, next) => {
    let { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ "result": "Missing order_id" });
    }

    try {
        // ลบจาก `order_detail`
        let deleteDetailQuery = `DELETE FROM order_detail WHERE order_id = ?`;
        connection_final.query(deleteDetailQuery, [order_id], (err, detailResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ "result": "Database Error" });
            }

            // ลบจาก `orders`
            let deleteOrderQuery = `DELETE FROM orders WHERE order_id = ?`;
            connection_final.query(deleteOrderQuery, [order_id], (err, orderResult) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ "result": "Database Error" });
                }

                res.status(200).json({
                    "result_code": "200",
                    "result": "Order Deleted Successfully"
                });
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "result": "Internal Server Error" });
    }
};
