process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
require('dotenv').config();
const dbconnection = require("../../database/dbconnection");
const { assert } = require("chai");
const logger = require('../../src/config/config').logger
const jwt = require('jsonwebtoken');
const { jwtSecretKey } = require('../../src/config/config').jwtSecretKey;

//token to use for tests that need authentication token to pass, will expire in a week or 2
//valid token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ3LCJpYXQiOjE2NTI5NjM1NDUsImV4cCI6MTY1NDAwMDM0NX0.6m-xqHSnb1ekPubW6-t0Fbpxaxuo3LxypI4cPz-dEOE"


chai.should();
chai.use(chaiHttp);

describe("Manage Meals and Participations /api/meal", () => {

    //completely empties database before starting with tests, and adds one user
    before((done) => {
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('DELETE FROM meal;', function (error, result, field) {
                connection.query('DELETE FROM meal_participants_user;', function (error, result, field) {
                    connection.query('DELETE FROM user;', function (error, result, field) {
                        connection.query('INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +'(47, "Chevy", "Rietveld", "chevy@gmail.com", "berOertE5", "Van Wenastraat 31", "Giessenburg");', function (error, result, field) {
                            connection.query('INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +'(20, "Jan", "de Ruiter", "jan@gmail.com", "vsehUeftE5", "Dorpstraat 31", "Giessenburg");', function (error, result, field) {
                                connection.query('INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' + "(1, 'Pasta Bolognese met tomaat, spekjes en kaas', 'lekker', 'https://google.com', '2022-04-09 09:37:10', 4, 8.00, 20);", function (error, result, field) {
                                    if(error) throw error;
                                    connection.release();
                                    done();
                                }) 
                            })
                        })
                    });
                });
            });
        });
        logger.debug('before done')
    })

    describe("UC-301 add meals /api/meal", () => {

        beforeEach((done) => {
            dbconnection.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('ALTER TABLE meal AUTO_INCREMENT = 1;', (error, result, field) => {
                    connection.release();
                    done();
                });
            });
        });

        it("TC-301-1 When a required input is missing when creating a meal, a valid error should be returned", (done) => {
            chai.request(server).post("/api/meal").auth(token, { type: 'bearer' }).send({
                //name is missing
                description : "Een lekker frietje om te testen",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17T08:27:15.008Z",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Name must be a string");
                done();
            });
        })

        it("TC-301-2 User not logged in when creating a meal", (done) => {
            //no token sent to simulate user isnt logged in
            chai.request(server).post("/api/meal").send({
                name: "Test meal Friet",
                description : "Een lekker frietje om te testen",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17T08:27:15.008Z",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        })

        it("TC-301-3 Meal succesfully added", (done) => {
            chai.request(server).post("/api/meal").auth(token, { type: 'bearer' }).send({
                name : "Friet",
                description : "Een lekker frietje om te testen",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17T08:27:15.000Z",
                imageUrl : "https://google.com",
                allergenes : [
                    "noten",
                    "gluten"
                ],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(201)
                assert.deepEqual(result, {
                    id: 2,
                    isActive : true,
                    isVega : false,
                    isVegan : false,
                    isToTakeHome : true,
                    dateTime: "2022-05-17T08:27:15.000Z",
                    maxAmountOfParticipants : 6,
                    price : 15.99, 
                    imageUrl : "https://google.com",
                    cookId : 47,
                    createDate : result.createDate,
                    updateDate : result.updateDate,
                    name : "Friet",
                    description : "Een lekker frietje om te testen",
                    allergenes : "gluten,noten",
                })
                done();
            });
        })
    });

    describe("UC-302 Update meals /api/meal", () => {

        it("TC-302-1 When a required input is missing when updating a meal, a valid error should be returned", (done) => {
            chai.request(server).put("/api/meal/2").auth(token, { type: 'bearer' }).send({
                //name is missing
                description : "Deze update gaat niet werken hoor",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17 08:27:15",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Name must be a string");
                done();
            });
        })

        it("TC-302-2 User not logged in when updating a meal", (done) => {
            //no token sent to simulate user isnt logged in
            chai.request(server).put("/api/meal/2").send({
                name: "Frietje",
                description : "Een lekker frietje om te testen",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17 08:27:15",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        })

        it("TC-302-3 User is not the owner of the meal they are trying to update", (done) => {
            //with a meal from a user, using the token from another different user
            chai.request(server).put("/api/meal/1").auth(token, { type: 'bearer' }).send({
                name: "Frietje",
                description : "Een lekker frietje om te testen",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17 08:27:15",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(403)
                message.should.be.a("string").that.equals("User is not the owner of the meal that is being requested to be deleted or updated");
                done();
            });
        })

        it("TC-302-4 Meal requested to be updated doesnt exist", (done) => {
            chai.request(server).put("/api/meal/500").auth(token, { type: 'bearer' }).send({
                name : "Deze meal bestaat niet eens",
                description : "Deze update gaat niet werken hoor",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17 08:27:15",
                imageUrl : "https://google.com",
                allergenes : ["noten"],
                maxAmountOfParticipants : 6,
                price : 15.99 
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("Update failed, meal with ID 500 does not exist");
                done();
            });
        })

        it("TC-302-5 Meal succesfully updated", (done) => {
            chai.request(server).put("/api/meal/2").auth(token, { type: 'bearer' }).send({
                name : "Friet",
                description : "Super lekkere friet met een geupdate description!",
                isActive : 1,
                isVega : 0,
                isVegan : 0,
                isToTakeHome : 1,
                dateTime: "2022-05-17T08:27:15.000Z",
                imageUrl : "https://google.com",
                allergenes : [
                    "noten",
                    "gluten"
                ],
                maxAmountOfParticipants : 6,
                price : 14.45
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 2,
                    isActive : true,
                    isVega : false,
                    isVegan : false,
                    isToTakeHome : true,
                    dateTime: "2022-05-17T08:27:15.000Z",
                    maxAmountOfParticipants : 6,
                    price : 14.45, 
                    imageUrl : "https://google.com",
                    cookId : 47,
                    createDate : result.createDate,
                    updateDate : result.updateDate,
                    name : "Friet",
                    description : "Super lekkere friet met een geupdate description!",
                    allergenes : "gluten,noten",
                })
                done();
            });
        })
    })

    describe("UC-303 Overview of meals/get all meals /api/meal", () => {

        it("TC-303-1 Getting all meals returns a list with meals", (done) => {
            chai.request(server).get("/api/meal/").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                    id: 1,
                    isActive : 0,
                    isVega : 0,
                    isVegan : 0,
                    isToTakeHome : 1,
                    dateTime: "2022-04-09T09:37:10.000Z",
                    maxAmountOfParticipants : 4,
                    price : "8.00", 
                    imageUrl : "https://google.com",
                    cookId : 20,
                    createDate : result[0].createDate,
                    updateDate : result[0].updateDate,
                    name : "Pasta Bolognese met tomaat, spekjes en kaas",
                    description : "lekker",
                    allergenes : "",
                },
                    {
                    id: 2,
                    isActive : 1,
                    isVega : 0,
                    isVegan : 0,
                    isToTakeHome : 1,
                    dateTime: "2022-05-17T08:27:15.000Z",
                    maxAmountOfParticipants : 6,
                    price : "14.45", 
                    imageUrl : "https://google.com",
                    cookId : 47,
                    createDate : result[1].createDate,
                    updateDate : result[1].updateDate,
                    name : "Friet",
                    description : "Super lekkere friet met een geupdate description!",
                    allergenes : "gluten,noten",
                }])
                done();
            });
        })
    })

    describe("UC-304 Getting details of a meal /api/meal", () => {

        it("TC-304-1 Meal doesnt exist", (done) => {
            chai.request(server).get("/api/meal/500").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("Meal with ID 500 could not be found");
                done();
            });
        })

        it("TC-304-2 Details of an existing meal are returned", (done) => {
            chai.request(server).get("/api/meal/2").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 2,
                    isActive : true,
                    isVega : false,
                    isVegan : false,
                    isToTakeHome : true,
                    dateTime: "2022-05-17T08:27:15.000Z",
                    maxAmountOfParticipants : 6,
                    price : 14.45, 
                    imageUrl : "https://google.com",
                    cookId : 47,
                    createDate : result.createDate,
                    updateDate : result.updateDate,
                    name : "Friet",
                    description : "Super lekkere friet met een geupdate description!",
                    allergenes : "gluten,noten",
                })
                done();
            });
        })

        describe("UC-305 Deleting a meal /api/meal", () => {

            it("TC-305-1 User not logged in when deleting a meal", (done) => {
                //no token sent to simulate user isnt logged in
                chai.request(server).delete("/api/meal/2").send({
                })
                .end((err,res) => {
                    console.log(err);
                    res.should.be.an("object")
                    let {status, message} = res.body;
                    status.should.equals(401)
                    message.should.be.a("string").that.equals("User is not logged in");
                    done();
                });
            })
        })

        it("TC-305-2 User is not the owner of the meal they are trying to delete", (done) => {
            //with a meal from a user, using the token from another different user
            chai.request(server).delete("/api/meal/1").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(403)
                message.should.be.a("string").that.equals("User is not the owner of the meal that is being requested to be deleted or updated");
                done();
            });
        })

        it("TC-305-3 Meal requested to be deleted doesnt exist", (done) => {
            chai.request(server).delete("/api/meal/500").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("Delete failed, meal with ID 500 does not exist");
                done();
            });
        })

        it("TC-305-4 Meal succesfully deleted", (done) => {
            chai.request(server).delete("/api/meal/2").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(200)
                message.should.be.a("string").that.equals("Meal with ID 2 succesfully deleted");
                done();
            });
        })
    })

    describe("UC-401 Participating a user in a meal /api/meal/participate", () => {

        it("TC-401-1 User not logged in when trying to participate in a meal", (done) => {
            //no token sent to simulate user isnt logged in
            chai.request(server).get("/api/meal/1/participate").send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        })

        it("TC-401-2 Meal that user is trying to participate in doesnt exist", (done) => {
            chai.request(server).get("/api/meal/500/participate").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("Cant manage participation as meal with ID 500 does not exist");
                done();
            });
        })

        it("TC-401-3 User has succesfully participated in a meal", (done) => {
            chai.request(server).get("/api/meal/1/participate").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        currentlyParticipating: true,
                        currentAmountOfParticipants: 1
                    }
                ])
                done();
            });
        })
    })

    describe("UC-402 Removing a user participation from a meal /api/meal/participate", () => {

        it("TC-402-1 User not logged in when trying to remove participation in a meal", (done) => {
            //no token sent to simulate user isnt logged in
            chai.request(server).get("/api/meal/1/participate").send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        })

        it("TC-402-2 Meal that user is trying to remove participation from doesnt exist", (done) => {
            chai.request(server).get("/api/meal/500/participate").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("Cant manage participation as meal with ID 500 does not exist");
                done();
            });
        })

        it("TC-402-3 User has succesfully removed participation from a meal", (done) => {
            chai.request(server).get("/api/meal/1/participate").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                console.log(err);
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        currentlyParticipating: false,
                        currentAmountOfParticipants: 0
                    }
                ])
                done();
            });
        })
    })
});