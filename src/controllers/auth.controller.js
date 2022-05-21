const { equal } = require("assert");
const { isBuffer } = require("util");

const assert = require("assert");
const dbconnection = require("../../database/dbconnection")
const jwt = require('jsonwebtoken')
const logger = require('../config/config').logger
const jwtSecretKey = require('../config/config').jwtSecretKey

module.exports = {
    login(req, res, next) {
        dbconnection.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting connection from dbconnection')
                res.status(500).json({
                    error: err.toString(),
                    datetime: new Date().toISOString(),
                })
            }
            if (connection) {
                // 1. Kijk of deze useraccount bestaat.
                connection.query(
                    'SELECT * FROM `user` WHERE `emailAdress` = ?',
                    [req.body.emailAdress],
                    (err, rows, fields) => {
                        connection.release()
                        if (err) {
                            logger.error('Error: ', err.toString())
                            res.status(404).json({
                                status: 404,
                                message: err.message
                            })
                        }
                        if (rows) {
                            // 2. Er was een resultaat, check het password.
                            if (
                                rows &&
                                rows.length === 1 &&
                                rows[0].password == req.body.password
                            ) {
                                logger.info(
                                    'passwords DID match, sending userinfo and valid token'
                                )
                                // Extract the password from the userdata - we do not send that in the response.
                                const { password, ...userinfo } = rows[0]
                                // Create an object containing the data we want in the payload.
                                const payload = {
                                    userId: userinfo.id,
                                }
                                userinfo.isActive = userinfo.isActive ? true : false;

                                jwt.sign(
                                    payload,
                                    jwtSecretKey,
                                    { expiresIn: '12d' },
                                    function (err, token) {
                                        logger.debug(
                                            'User logged in, sending: ',
                                            userinfo
                                        )
                                        res.status(200).json({
                                            status: 200,
                                            result: { ...userinfo, token },
                                        })
                                    }
                                )
                            } else {
                                logger.info(
                                    'User not found or password invalid'
                                )
                                res.status(404).json({
                                    status: 404,
                                    message:'User not found or password invalid',
                                })
                            }
                        }
                    }
                )
            }
        })
    },
    validateLogin(req, res, next) {
        // Verify that we receive the expected input
        try {
            assert(typeof req.body.emailAdress === 'string','email must be a string.')
            assert(typeof req.body.password === 'string','password must be a string.')

            //password contains min. 8 characters which contains at least one lower- and uppercase letter, and one digit
            assert.match(req.body.password, /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "Password must contain min. 8 characters which contains at least one lower- and uppercase letter, and one digit");
            //emailAdress must be valid (found this regex online, not aware of all details)
            assert.match(req.body.emailAdress, /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "The provided Emailadress format is invalid");

            next()
        } catch (ex) {
            res.status(400).json({
                status: 400,
                message: ex.message,
                // datetime: new Date().toISOString(),
            })
        }
    },
    //Method to check if a user is the owner of the meal they are trying to update or delete
    validateOwnership(req,res,next) {
        const userId = req.userId;
        const mealId = req.params.mealId;

        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                if (error) throw error; 
                connection.release();
                if(results[0]){
                    const cookId = results[0].cookId;
                    if(userId !== cookId){
                        res.status(403).json({
                            status: 403,
                            message: "User is not the owner of the meal that is being requested to be deleted or updated",
                        });
                    } else {
                        next()
                    }
                } else {
                    next()
                }
            });
        });
    },
    validateOwnershipUserDelete(req, res, next) {
        const userId = req.userId;
        const deletingUserId = req.params.userId;

        dbconnection.getConnection(function (error, connection) {
            if (error) throw error;
            connection.query(
                'SELECT * FROM user WHERE id=?',
                [deletingUserId],
                function (error, result, fields) {
                    connection.release();
                    if (error) throw error;

                    logger.debug('result: ', result.length);

                    if (result.length < 1) {
                        next();
                    } else {
                        if (userId != deletingUserId) {
                            res.status(403).json({
                                status: 403,
                                message: 'User is not the owner',
                            });
                        } else {
                            next();
                        }
                    }
                }
            );
        });
    },
    validateToken(req, res, next) {
        logger.info('validateToken called')
        // logger.trace(req.headers)
        // The headers should contain the authorization-field with value 'Bearer [token]'
        const authHeader = req.headers.authorization
        if (!authHeader) {
            logger.warn('Authorization header missing!')
            res.status(401).json({
                status: 401,
                message: 'User is not logged in',
                // datetime: new Date().toISOString(),
            })
        } else {
            // Strip the word 'Bearer ' from the headervalue
            const token = authHeader.substring(7, authHeader.length)

            jwt.verify(token, jwtSecretKey, (err, payload) => {
                if (err) {
                    logger.warn('Not authorized')
                    res.status(401).json({
                        status: 401,
                        message: 'Not authorized',
                        // datetime: new Date().toISOString(),
                    })
                }
                if (payload) {
                    logger.debug('token is valid', payload)
                    // User heeft toegang. Voeg UserId uit payload toe aan
                    // request, voor ieder volgend endpoint.
                    req.userId = payload.userId
                    next()
                }
            })
        }
    },
}