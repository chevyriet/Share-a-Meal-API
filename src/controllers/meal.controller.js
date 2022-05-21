const { equal } = require("assert");
const assert = require("assert");
const { isBuffer } = require("util");
const dbconnection = require("../../database/dbconnection")
const logger = require('../config/config').logger

let controller = {
    //validates a meal before being created
    validateMeal: (req, res, next) => {
        let meal = req.body;
        let { dateTime, price, imageUrl, name, description, isToTakeHome, isVega, isVegan, isActive } = meal;
        try {
            assert(typeof imageUrl === "string", "ImageUrl must be a string");
            assert(typeof name === "string", "Name must be a string");
            assert(typeof description === "string", "Description must be a string");
            assert(typeof price === "number", "Price must be a number");
            assert(typeof dateTime === "string", "DateTime must be a string");
            assert(isToTakeHome != null, "isToTakeHome cannot be null");
            assert(isVega != null, "isVega cannot be null");
            assert(isVegan != null, "isVegan cannot be null");
            assert(isActive != null, "isActive cannot be null");
            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message,
            };
            next(error);
        }
    },
    //validates a meal before being updated, needed seperate method as update also needs a check for maxAmountOfParticipants, and create doesnt
    validateUpdateMeal: (req, res, next) => {
        let meal = req.body;
        let { maxAmountOfParticipants } = meal;
        try {
            assert(typeof maxAmountOfParticipants === "number", "Maximum amount of participants must be present");
            next();
        } catch (err) {
            const error = {
                status: 400,
                message: err.message,
            };
            next(error);
        }
    },
    //UC-301 Register a meal
    addMeal: (req,res) => {
        let meal = req.body;
        const cookId = req.userId
        let price = parseFloat(meal.price)
        console.log(price);
        let allergenes = req.body.allergenes.join();
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query(`INSERT INTO meal (dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description, isActive, isVega, isVegan, isToTakeHome, allergenes) VALUES(STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [meal.dateTime, meal.maxAmountOfParticipants, price, meal.imageUrl, cookId, meal.name, meal.description, meal.isActive, meal.isVega, meal.isVegan, meal.isToTakeHome, allergenes], function (error, results, fields) {
                if (error) {
                    console.log(error);
                    connection.release();
                    res.status(409).json({
                        status: 409,
                        message: `Could not add meal`
                    })
                } else {
                    connection.query('SELECT * FROM meal ORDER BY createDate DESC LIMIT 1;', (err, results, field) => {
                        connection.release();
                        results[0].price = price

                        results[0].isActive = meal.isActive ? true : false;
                        results[0].isVega = meal.isVega ? true : false;
                        results[0].isVegan = meal.isVegan ? true : false;
                        results[0].isToTakeHome = meal.isToTakeHome ? true : false;

                        res.status(201).json({
                        status: 201,
                        result: results[0],
                        })
                    })
                } 
            })
        })
    },
    //UC-302 Get all meals
    getAllMeals: (req,res) => {
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM meal;', function (error, results, fields) {
                if (error) throw error; 
                connection.release();
                logger.debug('Amount of results: ',results.length);
                res.status(200).json({
                    status: 200,
                    result: results,
                });
            });
        });
    },
    //UC-303 Get single meal by Id
    getMealById: (req,res) => {
        const mealId = req.params.mealId;
        logger.debug(`Meal with ID ${mealId} requested`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                connection.release();
                if(results.length > 0){
                    results[0].price = parseFloat(results[0].price)

                    let meal = results[0];
                    results[0].isActive = meal.isActive ? true : false;
                    results[0].isVega = meal.isVega ? true : false;
                    results[0].isVegan = meal.isVegan ? true : false;
                    results[0].isToTakeHome = meal.isToTakeHome ? true : false;

                    res.status(200).json({
                    status: 200,
                    result: results[0],
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `Meal with ID ${mealId} could not be found`
                    })
                }
            });
        });
    },
    //UC-304 Update a single meal 
    updateMeal: (req, res) => {
        const mealId = req.params.mealId;
        const updateMeal = req.body;
        let price = parseFloat(updateMeal.price)
        let updateAllergenes = req.body.allergenes.join()
        logger.debug(`Meal with ID ${mealId} requested to be updated`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query(`UPDATE meal SET name = ?, description = ?, isActive = ?, isVega = ?, isVegan = ?, isToTakeHome = ?, dateTime = STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ'), imageUrl = ?, allergenes = ?, maxAmountOfParticipants = ?, price = ? WHERE id = ?;`, [updateMeal.name, updateMeal.description, updateMeal.isActive, updateMeal.isVega, updateMeal.isVegan, updateMeal.isToTakeHome, updateMeal.dateTime, updateMeal.imageUrl, updateAllergenes, updateMeal.maxAmountOfParticipants, price, mealId], function (error, results, fields) {
                if(error) throw error
                if(results.affectedRows>0){
                    connection.query('SELECT * FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                        results[0].price = price

                        let meal = results[0];
                        results[0].isActive = meal.isActive ? true : false;
                        results[0].isVega = meal.isVega ? true : false;
                        results[0].isVegan = meal.isVegan ? true : false;
                        results[0].isToTakeHome = meal.isToTakeHome ? true : false;

                        res.status(200).json({
                            status: 200,
                            result: results[0],
                        });
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `Update failed, meal with ID ${mealId} does not exist`
                    })
                }
            });
            connection.release();
        });
    },
    //UC-305 Delete meal
    deleteMeal: (req,res) => {
        const mealId = req.params.mealId;
        logger.debug(`Meal with ID ${mealId} requested to be deleted`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query('DELETE FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                connection.release();
                if (error) throw error;

                if(results.affectedRows > 0){
                    res.status(200).json({
                    status: 200,
                    message: `Meal with ID ${mealId} succesfully deleted`,
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `Delete failed, meal with ID ${mealId} does not exist`,
                    });
                }
            });
        });
    },
    //add or deletes a user participation in a meal
    manageParticipation: (req,res) => {
        const mealId = req.params.mealId;
        const userId = req.userId;
        let meal;
        let currentAmountOfParticipants = 0;
        let currentlyParticipating;
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            //checks if meal exists
            connection.query('SELECT * FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                if (error) throw error;
                if(results.length !== 0){
                    meal = results[0];
                    //checks amount of participants in the meal
                    connection.query('SELECT * FROM meal_participants_user WHERE mealId = ?;', [mealId], function (error, results, fields) {
                        currentAmountOfParticipants = results.length;
                        //checks if user is already participating in the meal
                        connection.query('SELECT * FROM meal_participants_user WHERE mealId = ? AND userId = ?;', [mealId, userId], function (error, results, fields) {
                            if (error) throw error;
                            //if there are no results for a participation, it gets added (if the max isnt already reached)
                            if(results.length == 0){
                                if(currentAmountOfParticipants < meal.maxAmountOfParticipants){
                                    connection.query('INSERT INTO meal_participants_user (mealId, userId) VALUES(?, ?);', [mealId, userId], function (error, results, fields) {
                                        connection.release();
                                        if (error) throw error;
                                        currentAmountOfParticipants++;
                                        currentlyParticipating = true;
                                        logger.debug("User has sucessfully been participated")

                                        res.status(200).json({
                                            status: 200,
                                            result: [{
                                                "currentlyParticipating": currentlyParticipating,
                                                "currentAmountOfParticipants": currentAmountOfParticipants 
                                            }],
                                        });
                                    });
                                } else {
                                    connection.release();
                                    res.status(409).json({
                                        status: 409,
                                        message: `Cant add participation as max amount of participants has already been reached`,
                                    });
                                }
                            //if the user was already participated, it gets removed
                            } else {
                                console.log(results);
                                connection.query('DELETE FROM meal_participants_user WHERE mealId = ? AND userId = ?;', [mealId, userId], function (error, results, fields) {
                                    connection.release();
                                    if (error) throw error;
                                    currentAmountOfParticipants--;
                                    currentlyParticipating = false;
                                    logger.debug("User participation has sucessfully been removed")

                                    res.status(200).json({
                                        status: 200,
                                        result: [{
                                            "currentlyParticipating": currentlyParticipating,
                                            "currentAmountOfParticipants": currentAmountOfParticipants 
                                        }],
                                    });
                                }) 
                            }
                        });
                    })
                } else {
                    connection.release();
                    res.status(404).json({
                        status: 404,
                        message: `Cant manage participation as meal with ID ${mealId} does not exist`,
                    });
                }
            });
        });
    }
}

module.exports = controller;