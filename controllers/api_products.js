const mysql = require('mysql');
require("dotenv").config();
const connection_final= require("../components/connection_final");


//************************************************** Category ************************************************************
exports.select_all_category = (req, res, next) => {
    try {
        connection_final.query(
            'SELECT * FROM category',
            [],
            (err, results, fields) => {
                if (err) {
                    console.log("Error select data from the database", err);
                    return res.status(400).send();
                } else {
                    let _allCategory = results
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "user_info": _allCategory,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

exports.select_category_with_id = (req, res, next) => {
    let _data = req.body;
    let _category = _data.category;

if (typeof _category != 'undefined') {
    try {
        connection_final.query(
           'SELECT * FROM category where category = ?',
            [_category],
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


exports.insert_category = (req, res, next) => {
    let { category } = req.body;

    if (!category) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
                connection_final.query(
                    'INSERT INTO category (category) VALUES (?)',
                    [category],
                    (err, insertResults) => {
                        if (err) {
                            console.log("Error inserting category", err);
                            return res.status(400).json({ "result": "Database Error" });
                        }

                        res.status(201).json({
                            "result_code": "201",
                            "result": "Insert Success",
                            "inserted_id": insertResults.insertId,
                        });
                    }
                );
            }
        catch (err) {
            console.log(err);
            return res.status(500).json({ "result": "Server Error" });
    }
};

exports.update_category = (req, res, next) => {
    let { category, cat_id } = req.body;  // Get data from request body

    if (!category || !cat_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    console.log("Received data:", category, cat_id); // Debug log

    try {
                
                connection_final.query(
                    'UPDATE category SET category = ? WHERE cat_id = ?',
                    [category, cat_id],
                    (err, updateResults) => {
                        if (err) {
                            console.log("Error updating category", err);
                            return res.status(400).json({ "result": "Database Error" });
                        }

                        if (updateResults.affectedRows === 0) {
                            return res.status(404).json({ "result": "category Not Found" });
                        }

                        res.status(200).json({
                            "result_code": "200",
                            "result": "Update Success",
                            "affected_rows": updateResults.affectedRows,
                        });
                    }
                );
            }
        
    catch (err) {
        console.log(err);
        return res.status(500).json({ "result": "Server Error" });
    }
};


exports.delete_category = (req, res, next) => {
    let { cat_id } = req.body;  // Get data from request body

    if (!cat_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    console.log("Received data:", cat_id); // Debug log

    try {
                
                connection_final.query(
                    ' DELETE FROM category WHERE cat_id = ?',
                    [cat_id],
                    (err, updateResults) => {
                        if (err) {
                            console.log("Error updating category", err);
                            return res.status(400).json({ "result": "Database Error" });
                        }

                        if (updateResults.affectedRows === 0) {
                            return res.status(404).json({ "result": "category Not Found" });
                        }

                        res.status(200).json({
                            "result_code": "200",
                            "result": "Delete Success",
                            "affected_rows": updateResults.affectedRows,
                        });
                    }
                );
            }
        
    catch (err) {
        console.log(err);
        return res.status(500).json({ "result": "Server Error" });
    }
};

//************************************************** Brand ************************************************************


exports.select_all_brand = (req, res, next) => {
    try {
        connection_final.query(
            'SELECT * FROM brand',
            [],
            (err, results, fields) => {
                if (err) {
                    console.log("Error select data from the database", err);
                    return res.status(400).send();
                } else {
                    let _allBrand = results
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "user_info": _allBrand,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

exports.select_brand_with_id = (req, res, next) => {
    let _data = req.body;
    let _brand = _data.brand;
    
if (typeof _brand != 'undefined') {
    try {
        connection_final.query(
            'SELECT * FROM brand where brand = ?',
            [_brand],
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
}}

exports.insert_brand = (req, res, next) => {
    let { brand } = req.body;
    
    if (!brand) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
        connection_final.query(
            'INSERT INTO brand (brand) VALUES (?)',
            [brand],
            (err, insertResults) => {
                if (err) {
                    console.log("Error inserting brand", err);
                    return res.status(400).json({ "result": "Database Error" });
                }

                res.status(201).json({
                    "result_code": "201",
                    "result": "Insert Success",
                    "inserted_id": insertResults.insertId,
                });
            }
        );
    }
catch (err) {
    console.log(err);
    return res.status(500).json({ "result": "Server Error" });
}
};

exports.update_brand = (req, res, next) => {
    let { brand, brand_id } = req.body;  // Get data from request body
    
    if (!brand ||!brand_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    
    console.log("Received data:", brand, brand_id); // Debug log

    try {
                
                connection_final.query(
                    'UPDATE brand SET brand = ? WHERE brand_id = ?',
                    [brand, brand_id],
                    (err, updateResults) => {
                        if (err) {
                            console.log("Error updating brand", err);
                            return res.status(400).json({ "result": "Database Error" });
                        }

                        if (updateResults.affectedRows === 0) {
                            return res.status(404).json({ "result": "brand Not Found" });
                        }

                        res.status(200).json({
                            "result_code": "200",
                            "result": "Update Success",
                            "affected_rows": updateResults.affectedRows,
                        });
                    }
                );
            }
        
    catch (err) {
        console.log(err);
        return res.status(500).json({ "result": "Server Error" });
    }
};

exports.delete_brand = (req, res, next) => {
    let { brand_id } = req.body;  // Get data from request body
    
    if (!brand_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    
    console.log("Received data:", brand_id); // Debug log

    try {
                
        connection_final.query(
            ' DELETE FROM brand WHERE brand_id = ?',
            [brand_id],
            (err, updateResults) => {
                if (err) {
                    console.log("Error updating brand", err);
                    return res.status(400).json({ "result": "Database Error" });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(404).json({ "result": "brand Not Found" });
                }

                res.status(200).json({
                    "result_code": "200",
                    "result": "Delete Success",
                    "affected_rows": updateResults.affectedRows,
                });
            }
        );
    }

catch (err) {
console.log(err);
return res.status(500).json({ "result": "Server Error" });
}
};

//************************************************** Zone ************************************************************


exports.select_all_zone = (req, res, next) => {
    try {
        connection_final.query(
            'SELECT * FROM zone',
            [],
            (err, results, fields) => {
                if (err) {
                    console.log("Error select data from the database", err);
                    return res.status(400).send();
                } else {
                    let _allZone = results
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Success",
                        "user_info": _allZone,
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}

 exports.select_zone_with_id = (req, res, next) => {
    let _data = req.body;
    let _zone = _data.zone;
    
if (typeof _zone!= 'undefined') {
    try {
        connection_final.query(
            'SELECT * FROM zone where zone = ?',
            [_zone],
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
}}

exports.insert_zone = (req, res, next) => {
    let { zone, zone_detail } = req.body;
    
    if (!zone ||!zone_detail) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
        connection_final.query(
            'INSERT INTO zone (zone, zone_detail) VALUES (?,?)',
            [zone,zone_detail],
            (err, insertResults) => {
                if (err) {
                    console.log("Error inserting zone", err);
                    return res.status(400).json({ "result": "Database Error" });
                }

                res.status(201).json({
                    "result_code": "201",
                    "result": "Insert Success",
                    "inserted_id": insertResults.insertId,
                });
            }
        );
    }
catch (err) {
    console.log(err);
    return res.status(500).json({ "result": "Server Error" });
}
};

exports.update_zone = (req, res, next) => {
    let { zone, zone_detail, zone_id } = req.body;  // Get data from request body
    
    if (!zone || !zone_detail || !zone_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
                
        connection_final.query(
            'UPDATE zone SET zone = ?, zone_detail=? WHERE zone_id = ?',
            [zone, zone_detail, zone_id],
            (err, updateResults) => {
                if (err) {
                    console.log("Error updating zone", err);
                    return res.status(400).json({ "result": "Database Error" });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(404).json({ "result": "zone Not Found" });
                }

                res.status(200).json({
                    "result_code": "200",
                    "result": "Update Success",
                    "affected_rows": updateResults.affectedRows,
                });
            }
        );
    }

catch (err) {
console.log(err);
return res.status(500).json({ "result": "Server Error" });
}
};

exports.delete_zone = (req, res, next) => {
    let { zone_id } = req.body;  // Get data from request body
    
    if (!zone_id) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    
    console.log("Received data:", zone_id); // Debug log

    try {
                
        connection_final.query(
            'DELETE FROM zone WHERE zone_id = ?',
            [zone_id],
            (err, updateResults) => {
                if (err) {
                    console.log("Error updating zone", err);
                    return res.status(400).json({ "result": "Database Error" });
                }
                
                if (updateResults.affectedRows === 0) {
                    return res.status(404).json({ "result": "zone Not Found" });
                }
                
                res.status(200).json({
                    "result_code": "200",
                    "result": "Delete Success",
                    "affected_rows": updateResults.affectedRows,
                });
            }
        );
    }   catch(err) {
        console.log(err);
        return res.status(500).json({ "result": "Server Error" });
    }
};



//************************************************** Model ************************************************************


// exports.select_all_model = (req, res, next) => {
//     try {
//         connection_final.query(
//             'SELECT * FROM model',
//             [],
//             (err, results, fields) => {
//                 if (err) {
//                     console.log("Error select data from the database", err);
//                     return res.status(400).send();
//                 } else {
//                     let _allModel = results
//                     res.status(200).json({
//                         "result_code": "200",
//                         "result": "Success",
//                         "user_info": _allModel,
//                     });
//                 }
//             }
//         )
//     } catch (err) {
//         console.log(err);
//         return res.status(500).send();
//     }
// }


// exports.select_model_with_id = (req, res, next) => {
//     let _data = req.body;
//     let _model = _data.model;

// if (typeof _model!= 'undefined') {
//     try {
//         connection_final.query(
//             'SELECT * FROM model where model = ?',
//             [_model],
//             (err, results, fields) => {
//                 if (err) {
//                     console.log("Error select data from the database", err);
//                     return res.status(400).send();
//                 } else {
//                     let _userInfo = results
//                     res.status(200).json({
//                         "result_code": "200",
//                         "result": "Success",
//                         "user_info": _userInfo,
//                     });
//                 }
//             }
//         )
//     } catch (err) {
//         console.log(err);
//         return res.status(500).send();
//     }
// } else {
//     res.status(404).json({ "result": "Incorrect Parameter" });
// }}


// exports.insert_model = (req, res, next) => {
//     let { model, model_detail } = req.body;

//     if (!model || !model_detail) {
//         return res.status(400).json({ "result": "Missing required parameters" });
//     }

//     try {
//         // Check if the model already exists
//         connection_final.query(
//             'SELECT * FROM model WHERE model = ? AND model_detail = ?',
//             [model, model_detail],
//             (err, results) => {
//                 if (err) {
//                     console.log("Error checking model existence", err);
//                     return res.status(500).json({ "result": "Database Error" });
//                 }

//                 if (results.length > 0) {
//                     return res.status(409).json({ "result": "Duplicate Entry", "message": "Model already exists" });
//                 }

//                 // Insert only if no duplicate exists
//                 connection_final.query(
//                     'INSERT INTO model (model, model_detail) VALUES (?,?)',
//                     [model, model_detail],
//                     (err, insertResults) => {
//                         if (err) {
//                             console.log("Error inserting model", err);
//                             return res.status(500).json({ "result": "Database Error" });
//                         }

//                         res.status(201).json({
//                             "result_code": "201",
//                             "result": "Insert Success",
//                             "inserted_id": insertResults.insertId,
//                         });
//                     }
//                 );
//             }
//         );
//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ "result": "Server Error" });
//     }
// };


// exports.update_model = (req, res, next) => {
//     let { model, model_detail, model_id } = req.body;  // Get data from request body
    
//     if (!model || !model_detail || !model_id) {
//         return res.status(400).json({ "result": "Missing required parameters" });
//     }

//     try {
//         // Check if the model exists
//         connection_final.query(
//             'SELECT * FROM model WHERE model_id =?',
//             [model_id],
//             (err, results) => {
//                 if (err) {
//                     console.log("Error checking model existence", err);
//                     return res.status(500).json({ "result": "Database Error" });
//                 }
                
//                 if (results.length === 0) {
//                     return res.status(404).json({ "result": "Model Not Found" });
//                 }
                
//                 // Update only if the model exists
//                 connection_final.query(
//                     'UPDATE model SET model =?, model_detail=? WHERE model_id = ?',
//                     [model, model_detail, model_id],
//                     (err, updateResults) => {
//                         if (err) {
//                             console.log("Error updating model", err);
//                             return res.status(500).json({ "result": "Database Error" });
//                         }
                        
//                         if (updateResults.affectedRows === 0) {
//                             return res.status(404).json({ "result": "Model Not Found" });
//                         }
                        
//                         res.status(200).json({
//                             "result_code": "200",
//                             "result": "Update Success",
//                             "affected_rows": updateResults.affectedRows,
//                         });
//                     }
//                 );
//             }
//         );
//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ "result": "Server Error" });
//     }
// }


// exports.delete_model = (req, res, next) => {
//     let { model_id } = req.body;  // Get data from request body

//     if (!model_id) {
//         return res.status(400).json({ "result": "Missing required parameters" });
//     }

//     try {
//         // Check if the model exists
//         connection_final.query(
//             'SELECT * FROM model WHERE model_id = ?',
//             [model_id],
//             (err, results) => {
//                 if (err) {
//                     console.log("Error checking model existence", err);
//                     return res.status(500).json({ "result": "Database Error" });
//                 }

//                 if (results.length === 0) {
//                     return res.status(404).json({ "result": "Model Not Found" });
//                 }

//                 // Delete only if the model exists
//                 connection_final.query(
//                     'DELETE FROM model WHERE model_id = ?', [model_id],
//                     (err, deleteResults) => {
    
//                         if (err) {
//                             console.log("Error deleting model", err);
//                             return res.status(500).json({ "result": "Database Error" });
//                         }

//                         res.status(200).json({
//                             "result_code": "200",
//                             "result": "Delete Success",
//                             "affected_rows": deleteResults.affectedRows,
//                         });
//                     }
//                 );
//             }
//         );
//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ "result": "Server Error" });
//     }
// };


//************************************************** Product ************************************************************

exports.select_all_product = (req, res, next) => {
    try {
        let sql = `SELECT p.proid, p.ProductName, b.brand, c.category, z.zone, p.pro_detail, p.qty, p.qty_min, p.cost_price, p.retail_price, p.status
                   FROM products p 
                   LEFT JOIN brand b ON p.brand_id = b.brand_id 
                   LEFT JOIN category c ON p.cat_id = c.cat_id 
                   LEFT JOIN zone z ON p.zone_id = z.zone_id`;

        connection_final.query(sql, [], (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ "result": "Database Error" });
            }
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "products": results
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "result": "Internal Server Error" });
    }
}

exports.select_product_with_proname = (req, res, next) => {
    let _data = req.body;
    let _ProductName = _data.ProductName;

    if (typeof _ProductName != 'undefined') {
        try {
            connection_final.query(
                'SELECT * FROM products where ProductName = ?', [_ProductName],
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

exports.search_products = (req, res, next) => {
    let { ProductName, brand, category, zone, pro_detail, status } = req.body;

    let sql = `SELECT p.*, b.brand, c.category, z.zone, m.model 
               FROM products p
               LEFT JOIN brand b ON p.brand_id = b.brand_id
               LEFT JOIN category c ON p.cat_id = c.cat_id
               LEFT JOIN zone z ON p.zone_id = z.zone_id
               WHERE 1 = 1`;

    let values = [];

    if (ProductName) {
        sql += ` AND p.ProductName LIKE ?`;
        values.push(`%${ProductName}%`);
    }
    if (brand) {
        sql += ` AND b.brand = ?`;
        values.push(brand);
    }
    if (category) {
        sql += ` AND c.category = ?`;
        values.push(cat_id);
    }
    if (zone) {
        sql += ` AND z.zone = ?`;
        values.push(zone_id);
    }
    if (pro_detail) {
        sql += ` AND p.pro_detail LIKE ?`;
        values.push(`%${pro_detail}%`);
    }
    if (status) {
        sql += ` AND p.status = ?`;
        values.push(status);
    }

    connection_final.query(sql, values, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ "result": "Database Error" });
        }
        res.status(200).json({
            "result_code": "200",
            "result": "Success",
            "products": results
        });
    });
};

exports.insert_product = (req, res, next) => {
    let { ProductName, brand_id, cat_id, zone_id, pro_detail, qty, qty_min, cost_price, retail_price,  status } = req.body;

    if (!ProductName || !brand_id || !cat_id || !zone_id || !pro_detail || !qty || !qty_min || !cost_price || !retail_price || !status) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
        // ตรวจสอบว่า ProductName มีอยู่แล้วหรือไม่
        connection_final.query(
            'SELECT * FROM products WHERE ProductName = ?',
            [ProductName],
            (err, results) => {
                if (err) {
                    console.log("Error checking ProductName", err);
                    return res.status(500).json({ "result": "Database Error" });
                }

                if (results.length > 0) {
                    return res.status(400).json({ "result": "ProductName already exists" });
                }

                // ถ้า ProductName ยังไม่มีอยู่ในระบบ ให้ทำการ INSERT
                connection_final.query(
                    'INSERT INTO products (ProductName, brand_id, cat_id, zone_id, pro_detail, qty, qty_min, cost_price, retail_price, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [ProductName, brand_id, cat_id, zone_id, pro_detail, qty, qty_min, cost_price, retail_price, status],
                    (err, insertResults) => {
                        if (err) {
                            console.log("Error inserting product", err);
                            return res.status(400).json({ "result": "Database Error" });
                        }

                        res.status(201).json({
                            "result_code": "201",
                            "result": "Insert Success",
                            "inserted_id": insertResults.insertId,
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ "result": "Server Error" });
    }
};


exports.update_product = (req, res, next) => {
    let { ProductName, brand_id, cat_id, zone_id, pro_detail, qty, qty_min, cost_price, retail_price, status, proid } = req.body;
    
    console.log("API received update request with data:", req.body);

    // ກວດສອບວ່າມີ proid ເທົ່ານັ້ນທີ່ຈຳເປັນ
    if (!proid) {
        return res.status(400).json({ "result": "Missing proid parameter" });
    }

    try {
        // ສ້າງ SQL ແບບ dynamic
        let updateFields = [];
        let values = [];

        if (ProductName !== undefined) { updateFields.push("ProductName = ?"); values.push(ProductName); }
        if (brand_id !== undefined) { updateFields.push("brand_id = ?"); values.push(Number(brand_id)); }
        if (cat_id !== undefined) { updateFields.push("cat_id = ?"); values.push(Number(cat_id)); }
        if (zone_id !== undefined) { updateFields.push("zone_id = ?"); values.push(Number(zone_id)); }
        if (pro_detail !== undefined) { updateFields.push("pro_detail = ?"); values.push(pro_detail); }
        if (qty !== undefined) { updateFields.push("qty = ?"); values.push(Number(qty)); }
        if (qty_min !== undefined) { updateFields.push("qty_min = ?"); values.push(Number(qty_min)); }
        if (cost_price !== undefined) { updateFields.push("cost_price = ?"); values.push(Number(cost_price)); }
        if (retail_price !== undefined) { updateFields.push("retail_price = ?"); values.push(Number(retail_price)); }
        if (status !== undefined) { updateFields.push("status = ?"); values.push(status); }

        if (updateFields.length === 0) {
            return res.status(200).json({
                "result_code": "200",
                "result": "No fields to update",
            });
        }

        // ເພີ່ມ proid ສຳລັບເງື່ອນໄຂ WHERE
        values.push(Number(proid));

        // ສ້າງ SQL query ສຳລັບການອັບເດດ
        let sql = `UPDATE products SET ${updateFields.join(", ")} WHERE proid = ?`;
        
        console.log("EXECUTING SQL:", sql);
        console.log("WITH VALUES:", values);

        connection_final.query(sql, values, (err, results) => {
            if (err) {
                console.error("Database error in update:", err);
                return res.status(500).json({ "result": "Database Error", "error": err.message });
            }

            console.log("Database update results:", results);

            // ເຊັກວ່າມີການອັບເດດແທ້ຫຼືບໍ່
            if (results.affectedRows === 0) {
                return res.status(404).json({ "result": "Product not found or no changes" });
            }

            res.status(200).json({
                "result_code": "200",
                "result": "Update Success",
                "affected_rows": results.affectedRows,
                "changed_rows": results.changedRows
            });
        });
    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ "result": "Server Error", "error": err.message });
    }
};

exports.delete_product = (req, res, next) => {
    let { proid } = req.body;
    if (!proid) {
        return res.status(400).json({ result: "Missing required parameter" });
    }

    try {
        connection_final.query(
            'DELETE FROM products WHERE proid =?',
            [proid],
            (err, deleteResults) => {
                if (err) {
                    console.log("Error deleting product", err);
                    return res.status(500).json({ result: "Database Error" });
                }
                return res.status(200).json({
                    result_code: 200,
                    result: "Delete Success",
                    affected_rows: deleteResults.affectedRows,
                });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ result: "Server Error" });
    }
};


exports.select_min_product = (req, res, next) => {
    try {
        let sql = `SELECT p.proid, p.ProductName, b.brand, c.category, p.pro_detail, p.qty 
                   FROM products p 
                   LEFT JOIN brand b ON p.brand_id = b.brand_id 
                   LEFT JOIN category c ON p.cat_id = c.cat_id 
                   where p.qty <= p.qty_min`;

        connection_final.query(sql, [], (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ "result": "Database Error" });
            }
            res.status(200).json({
                "result_code": "200",
                "result": "Success",
                "products": results
            });
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ "result": "Internal Server Error" });
    }
}

//************************************************** End ************************************************************






