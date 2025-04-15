const mysql = require('mysql');
require("dotenv").config();
const connection_final= require("../components/connection_final");

exports.select_all_supplier = (req, res, next) => {
        try {
            connection_final.query(
                'SELECT * FROM supplier',
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


exports.select_supplier_with_id = (req, res, next) => {
    let _data = req.body;
    let _sup_name = _data.sup_name;
    
if (typeof _sup_name!= 'undefined') {
    try {
        connection_final.query(
            'SELECT * FROM supplier where sup_name = ?',
            [_sup_name],
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


exports.insert_supplier = (req, res, next) => {
    let {sup_name, contract_name , email, address, tel}= req.body;
    
    if (!sup_name ||!contract_name ||!email ||!address ||!tel) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }

    try {
        connection_final.query(
            'INSERT INTO supplier (sup_name, contract_name, email, address, tel) VALUES (?,?,?,?,?)',
            [sup_name, contract_name, email, address, tel],
            (err, results, fields) => {
                if (err) {
                    console.log("Error insert data to the database", err);
                    return res.status(400).send();
                } else {
                    res.status(200).json({
                        "result_code": "200",
                        "result": "Insert Success",
                    });
                }
            }
        )
    } catch (err) {
        console.log(err);
        return res.status(500).send();
    }
}


exports.update_supplier = (req, res, next) => {
    let { sup_id, sup_name, contract_name, email, address, tel } = req.body;
    let _sup_id = req.body.sup_id;
    if (!sup_id || !sup_name || !contract_name || !email || !address || !tel) {
        return res.status(400).json({ "result": "Missing required parameters" });
    }
    try {
        connection_final.query(
            'UPDATE supplier SET sup_name=?, contract_name=?, email=?, address=?, tel=? WHERE sup_id = ?',
            [sup_name, contract_name, email, address, tel, _sup_id],
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


exports.delete_supplier = (req, res, next) => {
    let { sup_id } = req.body;
    if (!sup_id) {return res.status(400).json({ "result": "Missing required parameters" });}
    try {
        connection_final.query(
            'DELETE FROM supplier WHERE sup_id = ?', [sup_id],
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
