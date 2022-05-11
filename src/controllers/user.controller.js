const { equal } = require("assert");
const assert = require("assert");
const { isBuffer } = require("util");
let database = [];
const dbconnection = require("../../database/dbconnection")

let controller={
    //validates a user before being created (Also need a separate one for validating postal-code and phonenumber on update)
    validateUser:(req,res,next)=>{
        let user = req.body;
        let { firstName, lastName, street, city, password, emailAdress } = user;
        try{
            //password contains 8-15 characters which contains at least one lower- and uppercase letter, one special character and one digit
            assert.match(password, /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/, "Password must contain 8-15 characters which contains at least one lower- and uppercase letter, one special character and one digit");
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
                result: err.message
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
            //regex for phonenumber must be 10 digits long
            assert.match(phoneNumber, /^\d{10}$/, "Phonenumber must be 10 digits long, example: 0612345678")
            next();
        } catch(err){
            const error={
                status: 400,
                result: err.message
            };
            next(error);
        }
    },
    //UC-201: Register as a new user (not using token)
    addUser: (req,res) => {
        let user = req.body;
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('INSERT INTO user (firstName, lastName, street, city, phoneNumber, emailAdress, password) VALUES(?, ?, ?, ?, ?, ?, ?);', [user.firstName, user.lastName, user.street, user.city, user.phoneNumber, user.emailAdress, user.password], function (error, result, fields) {
                if (error) {
                    connection.release();
                    res.status(409).json({
                        status: 409,
                        result: `Could not add user, the email has already been taken`
                    })
                } else {
                    connection.release();
                    res.status(201).json({
                        status: 201,
                        result: `User has been succesfully registered`,
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
            const firstName = searchTerms.name
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
                query = `SELECT * FROM user WHERE firstName = "${firstName}" AND isActive = ${isActive}`;
            } else if (firstName == undefined && isActive != undefined){
                query = `SELECT * FROM user WHERE isActive = ${isActive};`;
            } else {
                query = `SELECT * FROM user WHERE firstName = "${firstName}";`;
            }
        };
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            console.log(query);
            connection.query(query, function (error, results, fields) {
                if (error) throw error; 
                connection.release();
                console.log('Amount of results: ',results.length);
                res.status(200).json({
                    status: 200,
                    result: results,
                });
            });
        });
    },
    //UC-204: Get a single user by ID (doesnt return users meals aswell yet)
    getUserById:(req,res)=>{
        const userId = req.params.userId;
        console.log(`User with ID ${userId} requested`);
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
                        result: `User with ID ${userId} could not be found`
                    })
                }
            });
        });
    },
    //UC-206 Delete a user by ID (doesnt consider tokens and ownership of the account yet)
    deleteUser:(req,res) => {
        const userId = req.params.userId;
        let user;
        console.log(`User with ID ${userId} requested to be deleted`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query('DELETE FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                connection.release();
                if (error) throw error;

                if(results.affectedRows > 0){
                    res.status(200).json({
                    status: 200,
                    result: `User with ID ${userId} succesfully deleted`,
                    });
                } else {
                    res.status(400).json({
                        status: 400,
                        result: `User with ID ${userId} not found, and could not be deleted`,
                    });
                }
            });
        });
    },
    //UC-205: Update a single user by ID (doesnt consider tokens and ownership of the account yet)
    updateUser:(req,res)=>{
        const userId = req.params.userId;
        const updateUser = req.body;
        console.log(`User with ID ${userId} requested to be updated`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('UPDATE user SET firstName=?, lastName=?, isActive=?, emailAdress=?, password=?, phoneNumber=?, street=?, city=? WHERE id = ?;', [updateUser.firstName, updateUser.lastName, updateUser.isActive, updateUser.emailAdress, updateUser.password, updateUser.phoneNumber, updateUser.street, updateUser.city, userId], function (error, results, fields) {
                if(error){
                    res.status(401).json({
                        status: 401,
                        result: `Update failed, provided email already taken`
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
                        result: `Update failed, user with ID ${userId} does not exist`
                    })
                }
            });
            connection.release();
        });
    },
    getUserProfile:(req,res,next)=>{
        const error={
            status: 401,
            result: "Cant fetch user profile as this functionality has not been realized yet",
        };
        next(error);
    },
}
module.exports = controller;