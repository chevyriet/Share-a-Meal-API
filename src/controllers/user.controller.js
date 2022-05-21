const { equal } = require("assert");
const assert = require("assert");
const { isBuffer } = require("util");
const dbconnection = require("../../database/dbconnection")
const logger = require('../config/config').logger

let controller={
    //validates a user before being created (Also need a separate one for validating postal-code and phonenumber on update)
    validateUser:(req,res,next)=>{
        let user = req.body;
        let { firstName, lastName, street, city, password, emailAdress } = user;
        try{
            //password contains min. 8 characters which contains at least one lower- and uppercase letter, and one digit
            assert.match(password, /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "Password must contain min. 8 characters which contains at least one lower- and uppercase letter, and one digit");
            //emailAdress must be valid (found this regex online, not aware of all details)
            assert.match(emailAdress, /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "The provided Emailadress format is invalid");

            assert(typeof firstName === "string", "First name must be a string");
            assert(typeof lastName === "string", "Last name must be a string");
            assert(typeof password === "string", "Password must be a string");
            assert(typeof emailAdress === "string", "Email adress must be a string");
            assert(typeof street === "string", "Street must be a string");
            assert(typeof city === "string", "City must be a string");
            next();
        } catch(err){
            const error={
                status: 400,
                message: err.message
            };
            next(error);
        }
    },
    //validates a user before being updated, gets called after the validateUser method and checks on phone number because its required when updating but not when creating a user
    validateUpdateUser:(req,res,next)=>{
        let user = req.body;
        let { phoneNumber } = user;
        try{
            assert(typeof phoneNumber === "string", "Phonenumber must be a string");
            //regex for valid dutch phonenumber
            assert.match(phoneNumber, /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/, "Phonenumber must be 10 digits long, example: 0612345678")
            next();
        } catch(err){
            const error={
                status: 400,
                message: err.message
            };
            next(error);
        }
    },
    //UC-201: Register as a new user
    addUser: (req,res) => {
        let user = req.body;
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('INSERT INTO user (firstName, lastName, street, city, phoneNumber, emailAdress, password) VALUES(?, ?, ?, ?, ?, ?, ?);', [user.firstName, user.lastName, user.street, user.city, user.phoneNumber, user.emailAdress, user.password], function (error, result, fields) {
                if (error) {
                    connection.release();
                    res.status(409).json({
                        status: 409,
                        message: `Could not add user, the email has already been taken`
                    })
                } else {
                    connection.query('SELECT * FROM user WHERE emailAdress = ?', [user.emailAdress], function (error, results, fields) {
                        connection.release();
                        results[0].isActive = user.isActive ? true : false;
                        res.status(201).json({
                        status: 201,
                        result: results[0],
                        })
                    })
                } 
            })
        })
    },
    //UC-202: Get all users (not using token)
    getAllUsers:(req,res) => {
        let query = 'SELECT * FROM user;';
        if(/\?.+/.test(req.url)){ //checks if the url has any query parameters
            const searchTerms = req.query;
            const firstName = searchTerms.firstName
            let isActive = searchTerms.isActive
            if(isActive != undefined){
                if(isActive == "true"){
                    isActive=1;
                } else {
                    isActive=0;
                }
            }

            //formats query based of given searchterms
            if(firstName != undefined && isActive != undefined){
                query = `SELECT * FROM user WHERE firstName = '${firstName}' AND isActive = ${isActive}`;
            } else if (firstName == undefined && isActive != undefined){
                query = `SELECT * FROM user WHERE isActive = ${isActive};`;
            } else {
                query = `SELECT * FROM user WHERE firstName = '${firstName}';`;
            }
        };
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            logger.debug(query);
            connection.query(query, function (error, results, fields) {
                if (error) throw error; 
                connection.release();
                logger.debug('Amount of results: ',results.length);
                for (let i = 0; i < results.length; i++) {
                    results[i].isActive = (results[i].isActive) ? true : false;
                }
                res.status(200).json({
                    status: 200,
                    result: results,
                });
            });
        });
    },
    //UC-204: Get a single user by ID 
    getUserById:(req,res)=>{
        const userId = req.params.userId;
        logger.debug(`User with ID ${userId} requested`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                connection.release();
                if(results.length > 0){
                    res.status(200).json({
                    status: 200,
                    result: results[0],
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `User with ID ${userId} could not be found`
                    })
                }
            });
        });
    },
    //UC-206 Delete a user by ID (doesnt consider tokens and ownership of the account yet)
    deleteUser:(req,res) => {
        const userId = req.params.userId;
        let user;
        logger.debug(`User with ID ${userId} requested to be deleted`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query('DELETE FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                connection.release();
                if (error) throw error;

                if(results.affectedRows > 0){
                    res.status(200).json({
                    status: 200,
                    message: `User with ID ${userId} succesfully deleted`,
                    });
                } else {
                    res.status(400).json({
                        status: 400,
                        message: `User does not exist`,
                    });
                }
            });
        });
    },
    //UC-205: Update a single user by ID (doesnt consider tokens and ownership of the account yet)
    updateUser:(req,res)=>{
        const userId = req.params.userId;
        const updateUser = req.body;
        logger.debug(`User with ID ${userId} requested to be updated`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('UPDATE user SET firstName=?, lastName=?, isActive=?, emailAdress=?, password=?, phoneNumber=?, street=?, city=? WHERE id = ?;', [updateUser.firstName, updateUser.lastName, updateUser.isActive, updateUser.emailAdress, updateUser.password, updateUser.phoneNumber, updateUser.street, updateUser.city, userId], function (error, results, fields) {
                if(error){
                    res.status(401).json({
                        status: 401,
                        message: `Update failed, provided email already taken`
                    })
                    return;
                }
                if(results.affectedRows>0){
                    connection.query('SELECT * FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                        res.status(200).json({
                            status: 200,
                            result: results[0],
                        });
                    });
                } else {
                    res.status(400).json({
                        status: 400,
                        message: `Update failed, user with ID ${userId} does not exist`
                    })
                }
            });
            connection.release();
        });
    },
    //UC-203 Request personal user profile (If user provides a valid JWT token)
    getUserProfile:(req,res,next)=>{
        const userId = req.userId;
        logger.debug(`Personal profile of user with ID ${userId} requested`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                connection.release();

                res.status(200).json({
                    status: 200,
                    result: results[0],
                });
            });
        });
    },
}
module.exports = controller;