const { equal } = require("assert");
const assert = require("assert");
const { isBuffer } = require("util");
const dbconnection = require("../../database/dbconnection")
const logger = require('../config/config').logger

let controller = {
    // validateMeal: (req, res) => {
    //     let meal = req.body;
        
    //     // validates meal attributes
    //     try {
    //         next();
    //     } catch (err) {
    //         const error = {
    //             status: 400,
    //             message: err.message,
    //         };
    //     }
    // },

    //UC-301 Register a meal
    addMeal: (req,res) => {
        let meal = req.body;
        const cookId = req.userId
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('INSERT INTO meal (datetime, maxAmountOfParticipants, price, imageUrl, cookId, name, description, isActive, isVega, isVegan, isToTakeHome) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [meal.datetime, meal.maxAmountOfParticipants, meal.price, meal.imageUrl, cookId, meal.name, meal.description, meal.isActive, meal.isVega, meal.isVegan, meal.isToTakeHome], function (error, results, fields) {
                if (error) {
                    connection.release();
                    res.status(409).json({
                        status: 409,
                        message: `Could not add meal`
                    })
                } else {
                    connection.query('SELECT * FROM meal ORDER BY dateTime DESC LIMIT 1;', (err, results, field) => {
                        connection.release();
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
                    message: results,
                });
            });
        });
    },
    //UC-303 Get single meal by Id
    getMealById: (req,res) => {
        const mealId = req.params.mealId;
        logger.debug(`User with ID ${mealId} requested`);
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err; 
            connection.query('SELECT * FROM meal WHERE id = ?;', [mealId], function (error, results, fields) {
                connection.release();
                if(results.length > 0){
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

    },
    //UC-305 Delete meal
    deleteMeal: (req,res) => {

    }

}
module.exports = controller;