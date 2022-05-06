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
            assert.match(emailAdress, /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "The provided Emailadress must be valid");

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
    //UC-201: Register as a new user (not using token)
    addUser: (req,res) => {
        let user = req.body;
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('INSERT INTO user (firstName, lastName, street, city, phoneNumber, emailAdress, password) VALUES(?, ?, ?, ?, ?, ?, ?);', [user.firstName, user.lastName, user.street, user.city, user.phoneNumber, user.emailAdress, user.password], function (error, result, fields) {
                if (error) {
                    connection.release();
                    res.status(401).json({
                        status: 401,
                        result: `Could not add user, the email ${user.emailAdress} has already been taken`
                    })
                } else {
                    connection.release();
                    res.status(201).json({
                        status: 201,
                        result: `User has been succesfully registered.`,
                    })
                }
            })
        })
    },
    //UC-202: Get all users (not using token), also doesnt work with a search term yet like mentioned in FO
    getAllUsers:(req,res) => {
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM user;', function (error, results, fields) {
                connection.release();
                if(results.length > 0){
                    console.log('Amount of results: ',results.length);
                    res.status(200).json({
                    status: 200,
                    result: results,
                    });
                } else {
                    res.status(401).json({
                        status: 401,
                        result: `No users were found`
                    })
                }
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
                    res.status(401).json({
                        status: 401,
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
            connection.query('SELECT * FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                if (err) throw err;
                user = results;
            });
            connection.query('DELETE FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                connection.release();
                if(results.affectedRows > 0){
                    res.status(201).json({
                    status: 201,
                    result: user,
                    });
                } else {
                    res.status(401).json({
                        status: 401,
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
            connection.query('UPDATE user SET firstName=?, lastName=?, emailAdress=?, password=?, phoneNumber=?, street=?, city=? WHERE id = ?;', [updateUser.firstName, updateUser.lastName, updateUser.emailAdress, updateUser.password, updateUser.phoneNumber, updateUser.street, updateUser.city, userId], function (error, results, fields) {
                if(error){
                    res.status(401).json({
                        status: 401,
                        result: `Update failed, provided email already taken`
                    })
                    return;
                }
                if(results.affectedRows>0){
                    connection.query('SELECT * FROM user WHERE id = ?;', [userId], function (error, results, fields) {
                        res.status(201).json({
                            status: 201,
                            result: results,
                        });
                    });
                } else {
                    res.status(401).json({
                        status: 401,
                        result: `Update failed, user does not exist`
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
    }
}
module.exports = controller;