process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
require('dotenv').config();
const dbconnection = require("../../database/dbconnection");
const { assert } = require("chai");
const logger = require('../../src/config/config').logger
const jwt = require('jsonwebtoken');
const jwtSecretKey = require('../../src/config/config').jwtSecretKey

chai.should();
chai.use(chaiHttp);

//token to use for tests that need authentication token to pass, will expire in a week or 2
//valid token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ3LCJpYXQiOjE2NTI5NjM1NDUsImV4cCI6MTY1NDAwMDM0NX0.6m-xqHSnb1ekPubW6-t0Fbpxaxuo3LxypI4cPz-dEOE"

describe("Manage Users /api/user",() => {
    
    //completely empties database before starting with tests, so tests start with a clean database
    before((done) => {
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;
            connection.query('DELETE FROM meal;', function (error, result, field) {
                connection.query('DELETE FROM meal_participants_user;', function (error, result, field) {
                    connection.query('DELETE FROM user;', function (error, result, field) {
                        connection.release();
                        done();
                    });
                });
            });
        });
        logger.debug('before done')
    })

    describe("UC-201 add users /api/user", ()=> {
        //clears and fills the test database before each test starts in this describe block, also resets auto increment
        beforeEach((done) => {
            dbconnection.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('DELETE FROM user;', (error, result, field) => {
                    connection.query('ALTER TABLE user AUTO_INCREMENT = 1;', (error, result, field) => {
                        connection.query('INSERT INTO user (id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);', [1, 'Mariëtte', 'van den Dullemen', 'Groenstraat 10', 'Rotterdam' , 1, 'm.vandullemen@server.nl', 'pfefejW41', '0687629321'], (error, result, field) => {
                            connection.release();
                            done();
                        });
                    });
                });
            });
        });
        
        it("TC-201-1 When a required input is missing when creating a user, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                //firstName not present
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("First name must be a string");
                done();
            });
        });

        it("TC-201-2 When the Emailadress format is invalid, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                emailAdress: "chevy.gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("The provided Emailadress format is invalid");
                done();
            });
        });

        it("TC-201-3 When the password format is invalid, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "secret",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Password must contain min. 8 characters which contains at least one lower- and uppercase letter, and one digit");
                done();
            });
        });

        it("TC-201-4 When the user (email) already exists, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                emailAdress: "m.vandullemen@server.nl"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(409)
                message.should.be.a("string").that.equals("Could not add user, the email has already been taken");
                done();
            });
        });
        //token not yet taken into consideration
        it("TC-201-5 User has been succesfully added", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                phoneNumber: "0651160300",
                password: "wvqOertE5",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(201)
                assert.deepEqual(result, {
                    id: 2,                          
                    firstName: 'Chevy',             
                    lastName: 'Rietveld',           
                    isActive: false,                    
                    emailAdress: 'chevy@gmail.com', 
                    password: 'wvqOertE5',
                    phoneNumber: "0651160300",            
                    roles: 'editor,guest',          
                    street: 'Van Wenastraat 31',    
                    city: 'Giessenburg'
                })
                done();
            });
        });
    });

    describe("UC-203 Getting personal user profile /api/user/profile", () => {

        it("TC-203-1 Invalid token when retrieving personal user profile", (done) => {
            chai.request(server).get("/api/user/profile").auth("invalidTokenExample", { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("Not authorized");
                done();
            });
        });

        it("TC-203-2 Valid token and user exists when retrieving personal user profile", (done) => {
            chai.request(server).get("/api/user/profile").set('authorization', 'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey))
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 2,                          
                    firstName: 'Chevy',             
                    lastName: 'Rietveld',           
                    isActive: 1,                    
                    emailAdress: 'chevy@gmail.com', 
                    password: 'wvqOertE5',
                    phoneNumber: "0651160300",            
                    roles: 'editor,guest',          
                    street: 'Van Wenastraat 31',    
                    city: 'Giessenburg'
                })
                done();
            });
        });
    })

    describe("UC-204 Details of a user /api/user", ()=> {
        
        it("TC-204-1 Invalid token when retrieving user details", (done) => {
            chai.request(server).get("/api/user/1").auth("invalidTokenExample", { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("Not authorized");
                done();
            });
        });

        it("TC-204-2 User ID doesnt exist", (done) => {
            chai.request(server).get("/api/user/356783").auth(token, { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("User with ID 356783 could not be found");
                done();
            });
        });

        it("TC-204-3 User ID exists", (done) => {
            chai.request(server).get("/api/user/1").auth(token, { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 1,
                    firstName: 'Mariëtte',
                    lastName: 'van den Dullemen',
                    isActive: 1,
                    emailAdress: 'm.vandullemen@server.nl',
                    password: 'pfefejW41',
                    phoneNumber: '0687629321',
                    roles: 'editor,guest',
                    street: 'Groenstraat 10',
                    city: 'Rotterdam',
                    })
                done();
            });
        });
    });

    describe("UC-205 Updating a user /api/user", ()=> {

        it("TC-205-1 When a required input is missing when updating a user, a valid error should be returned ", (done) => {
            chai.request(server).put("/api/user/2").auth(token, { type: 'bearer' }).send({
                //firstName is missing
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                phoneNumber: "0651160300",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("First name must be a string");
                done();
            });
        });

        it("TC-205-3 Invalid phonenumber when updating user", (done) => {
            chai.request(server).put("/api/user/2").auth(token, { type: 'bearer' }).send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                phoneNumber: "4958",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Phonenumber must be 10 digits long, example: 0612345678");
                done();
            });
        });

        it("TC-205-4 User requested to be updated doesnt exist", (done) => {
            chai.request(server).put("/api/user/999").auth(token, { type: 'bearer' }).send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5",
                phoneNumber: "0651160300",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Update failed, user with ID 999 does not exist");
                done();
            });
        });

        it("TC-205-5 User isnt logged in when trying to update", (done) => {
            //no token sent to simulate user not logged in
            chai.request(server).put("/api/user/1").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        });

        it("TC-205-6 User succesfully updated", (done) => {
            chai.request(server).put("/api/user/2").auth(token, { type: 'bearer' }).send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                isActive: 0,
                password: "wvqOertE5",
                phoneNumber: "0651160300",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 2,                          
                    firstName: 'Chevy',             
                    lastName: 'Rietveld',           
                    isActive: 0,                    
                    emailAdress: 'chevy@gmail.com', 
                    password: 'wvqOertE5',         
                    phoneNumber: '0651160300',      
                    roles: 'editor,guest',          
                    street: 'Van Wenastraat 31',    
                    city: 'Giessenburg'                           
                    })
                done();
            });
        });
    });

    describe("UC-202 Overview of users/getting all users /api/user", ()=> {

        it("TC-202-1 Anything that makes it so zero users result must return an empty list ", (done) => {
            chai.request(server).get("/api/user?name=souhieu").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(0);
                done();
            });
        });

        it("TC-202-2 Show two users", (done) => {
            chai.request(server).get("/api/user").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(2);
                done();
            });
        });

        it("TC-202-3 Search for non-existing name while getting all users", (done) => {
            chai.request(server).get("/api/user?firstName=sjjhekgrgr").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(0);
                done();
            });
        });

        it("TC-202-4 Search for users with isActive=false", (done) => {
            chai.request(server).get("/api/user?isActive=false").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(1);
                done();
            });
        });

        it("TC-202-5 Search for users with isActive=true", (done) => {
            chai.request(server).get("/api/user?isActive=true").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(1);
                done();
            });
        });

        it("TC-202-6 Search for users with existing name as searchterm", (done) => {
            chai.request(server).get("/api/user?firstName=Chevy").auth(token, { type: 'bearer' }).send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.an('array').that.lengthOf(1);
                done();
            });
        });
    });

    describe("UC-101 Login /api/auth/login", () => {

        it("TC-101-1 Required input missing when trying to login", (done) => {
            chai.request(server).post("/api/auth/login").send({
                emailAdress: "chevy@gmail.com"
                //password not present
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("password must be a string.");
                done();
            });
        })

        it("TC-101-2 Invalid emailAdress when trying to login", (done) => {
            chai.request(server).post("/api/auth/login").send({
                emailAdress: "invalid",
                password: "wvqOertE5"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("The provided Emailadress format is invalid");
                done();
            });
        })

        it("TC-101-3 Invalid password when trying to login", (done) => {
            chai.request(server).post("/api/auth/login").send({
                emailAdress: "chevy@gmail.com",
                password: "invalid"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("Password must contain min. 8 characters which contains at least one lower- and uppercase letter, and one digit");
                done();
            });
        })

        it("TC-101-4 User thats trying to log in doesnt exist", (done) => {
            chai.request(server).post("/api/auth/login").send({
                //emailAdress doesnt exist in the database so user doesnt exist
                emailAdress: "nonexistantemail@gmail.com",
                password: "sjenUiicc2"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(404)
                message.should.be.a("string").that.equals("User not found or password invalid");
                done();
            });
        })

        it("TC-101-5 User succesfully logged in", (done) => {
            chai.request(server).post("/api/auth/login").send({
                emailAdress: "chevy@gmail.com",
                password: "wvqOertE5"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, {
                    id: 2,                          
                    firstName: 'Chevy',             
                    lastName: 'Rietveld',           
                    isActive: false,                    
                    emailAdress: 'chevy@gmail.com',          
                    phoneNumber: '0651160300',      
                    roles: 'editor,guest',          
                    street: 'Van Wenastraat 31',    
                    city: 'Giessenburg',                    
                    token: result.token                                                
                    })
                done();
            });
        })
    })

    describe("UC-206 Deleting a user /api/user", ()=> {

        before((done) => {
            dbconnection.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('DELETE FROM user;', (error, result, field) => {
                    connection.query('ALTER TABLE user AUTO_INCREMENT = 2;', (error, result, field) => {
                        connection.query('INSERT INTO user (id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);', [1, 'Mariëtte', 'van den Dullemen', 'Groenstraat 10', 'Rotterdam' , 1, 'm.vandullemen@server.nl', 'pfefejW41', '0687629321'], (error, result, field) => {
                            connection.query('INSERT INTO user (id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);', [47, 'Chevy', 'Rietveld', 'Groenstraat 10', 'Rotterdam' , 1, 'chevy@gmail.com', 'pfefejW41', '0687629321'], (error, result, field) => {
                                connection.release();
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("TC-206-1 User requested to be deleted doesnt exist", (done) => {
            chai.request(server).delete("/api/user/999").auth(token, { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(400)
                message.should.be.a("string").that.equals("User does not exist");
                done();
            });
        });

        it("TC-206-2 User isnt logged in when trying to delete", (done) => {
            //no token sent to simulate user not logged in
            chai.request(server).delete("/api/user/1")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(401)
                message.should.be.a("string").that.equals("User is not logged in");
                done();
            });
        });

        it("TC-206-3 User is not the owner of the user they are trying to delete", (done) => {
            chai.request(server).delete("/api/user/1").auth(token, { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(403)
                message.should.be.a("string").that.equals("User is not the owner");
                done();
            });
        });

        it("TC-206-4 User succesfully deleted", (done) => {
            chai.request(server).delete("/api/user/47").auth(token, { type: 'bearer' })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, message} = res.body;
                status.should.equals(200)
                message.should.be.a("string").that.equals("User with ID 47 succesfully deleted");
                done();
            });
        });
    });
});