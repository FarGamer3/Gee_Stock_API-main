const mysql = require('mysql');
require("dotenv").config();
const connection_final= require("../components/connection_final");


exports.select_all_customer = (req, res, next) => {
        try {
            connection_final.query(
                'SELECT * FROM customer',
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


exports.select_customer_with_tel = (req, res, next) => {
    let _data = req.body;
    let _tel = _data.tel;
    
        if (typeof _tel != 'undefined') {
            try {
                connection_final.query(
                    'SELECT * FROM customer where tel = ?',
                    [_tel],
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
        }
        else {
            res.status(404).json({ "result": "Incorrect Parameter" });
        }
    }


    exports.insert_customer = (req, res, next) => {
        let {cus_name, cus_lname , gender, address, tel}= req.body;
        
        if (!cus_name ||!cus_lname ||!gender ||!address ||!tel) {
            return res.status(400).json({ "result": "Missing required parameters" });
        }
    
        try {
            connection_final.query(
                'INSERT INTO customer (cus_name, cus_lname , gender, address, tel) VALUES (?,?,?,?,?)',
                [cus_name, cus_lname , gender, address, tel],
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


    exports.update_customer = (req, res, next) => {
        let { cus_id, cus_name, cus_lname, gender,address, tel } = req.body;
        let _cus_id = req.body.cus_id;
        if (!cus_id || !cus_name || !cus_lname || !gender || !address || !tel) {
            return res.status(400).json({ "result": "Missing required parameters" });
        }
        try {
            connection_final.query(
                'UPDATE customer SET cus_name=?, cus_lname=?, gender=?, address=?, tel=? WHERE cus_id = ?',
                [cus_name, cus_lname, gender, address, tel, _cus_id],
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


    exports.delete_customer = (req, res, next) => {
    let _data = req.body;
    let _cus_id = _data.cus_id;
    if (typeof _cus_id != 'undefined') {
        try {
            connection_final.query(
                'DELETE FROM customer WHERE cus_id = ?',
                [_cus_id],
                (err, results, fields) => {
                    if (err) {
                        console.log("Error delete data to the database", err);
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
    else {
        res.status(404).json({ "result": "Incorrect Parameter" });
    }};
