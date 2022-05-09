process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
require('dotenv').config();
const dbconnection = require("../../database/dbconnection");
const { assert } = require("chai");

chai.should();
chai.use(chaiHttp);

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
        console.log('before done')
    })

    describe("UC-201 add users /api/user", ()=> {
        //clears and fills the test database before each test starts in this describe block, also resets auto increment
        beforeEach((done) => {
            dbconnection.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('DELETE FROM user;', (error, result, field) => {
                    connection.query('ALTER TABLE user AUTO_INCREMENT = 1;', (error, result, field) => {
                        connection.query('INSERT INTO user (id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);', [1, 'Mariëtte', 'van den Dullemen', 'Groenstraat 10', 'Rotterdam' , 1, 'm.vandullemen@server.nl', 'pfefejW41!', '0687629321'], (error, result, field) => {
                            connection.release();
                            done();
                        });
                    });
                });
            });
        });
        
        it("TC-201-1 When a required input is missing when creating a user, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                //firstName ontbreekt
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("First name must be a string");
                done();
            });
        });

        it("TC-201-2 When the Emailadress format is invalid, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                emailAdress: "chevy.gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("The provided Emailadress format is invalid");
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
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("Password must contain 8-15 characters which contains at least one lower- and uppercase letter, one special character and one digit");
                done();
            });
        });

        it("TC-201-4 When the user (email) already exists, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                emailAdress: "m.vandullemen@server.nl"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(409)
                result.should.be.a("string").that.equals("Could not add user, the email has already been taken");
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
                password: "wvqOertE5!",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(201)
                result.should.be.a("string").that.equals("User has been succesfully registered");
                done();
            });
        });
    });

    describe("UC-204 Details of a user /api/user", ()=> {
        
        //cant do this one yet as token isnt implemented yet, so its told to be skipped
        xit("TC-204-1 Invalid token when retrieving user details", (done) => {
            chai.request(server).get("/api/user/")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(401)
                result.should.be.a("string").that.equals("Search failed as user token is invalid");
                done();
            });
        });

        it("TC-204-2 User ID doesnt exist", (done) => {
            chai.request(server).get("/api/user/356783")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(404)
                result.should.be.a("string").that.equals("User with ID 356783 could not be found");
                done();
            });
        });

        it("TC-204-3 User ID exists", (done) => {
            chai.request(server).get("/api/user/1")
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
                    password: 'pfefejW41!',
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
            chai.request(server).put("/api/user/2").send({
                //firstName is missing
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                phoneNumber: "0651160300",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("First name must be a string");
                done();
            });
        });

        it("TC-205-3 Invalid phonenumber when updating user", (done) => {
            chai.request(server).put("/api/user/2").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                phoneNumber: "4958",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("Phonenumber must be 10 digits long, example: 0612345678");
                done();
            });
        });

        it("TC-205-4 User requested to be updated doesnt exist", (done) => {
            chai.request(server).put("/api/user/999").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "wvqOertE5!",
                phoneNumber: "0651160300",
                emailAdress: "chevy@gmail.com"
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("Update failed, user with ID 999 does not exist");
                done();
            });
        });

        //cant do this one yet as token/login function isnt implemented yet, so its told to be skipped
        xit("TC-205-5 User isnt logged in when trying to update", (done) => {
            chai.request(server).put("/api/user/").send({
                //
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(401)
                result.should.be.a("string").that.equals("Cant update user, as you are not logged in");
                done();
            });
        });

        it("TC-205-6 User succesfully updated", (done) => {
            chai.request(server).put("/api/user/2").send({
                firstName: "Chevy",
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                isActive: 0,
                password: "wvqOertE5!",
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
                    password: 'wvqOertE5!',         
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
            chai.request(server).get("/api/user?name=souhieu").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [])
                done();
            });
        });

        it("TC-202-2 Show two users", (done) => {
            chai.request(server).get("/api/user").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        id: 1,
                        firstName: 'Mariëtte',
                        lastName: 'van den Dullemen',
                        isActive: 1,
                        emailAdress: 'm.vandullemen@server.nl',
                        password: 'pfefejW41!',
                        phoneNumber: '0687629321',
                        roles: 'editor,guest',
                        street: 'Groenstraat 10',
                        city: 'Rotterdam',
                    },
                    {
                        id: 2,                          
                        firstName: 'Chevy',             
                        lastName: 'Rietveld',           
                        isActive: 0,                    
                        emailAdress: 'chevy@gmail.com', 
                        password: 'wvqOertE5!',         
                        phoneNumber: '0651160300',      
                        roles: 'editor,guest',          
                        street: 'Van Wenastraat 31',    
                        city: 'Giessenburg'  
                    }
                ])
                done();
            });
        });

        it("TC-202-3 Search for non-existing name while getting all users", (done) => {
            chai.request(server).get("/api/user?name=sjjhekgrgr").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [])
                done();
            });
        });

        it("TC-202-4 Search for users with isActive=false", (done) => {
            chai.request(server).get("/api/user?isActive=false").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        id: 2,                          
                        firstName: 'Chevy',             
                        lastName: 'Rietveld',           
                        isActive: 0,                    
                        emailAdress: 'chevy@gmail.com', 
                        password: 'wvqOertE5!',         
                        phoneNumber: '0651160300',      
                        roles: 'editor,guest',          
                        street: 'Van Wenastraat 31',    
                        city: 'Giessenburg'
                    }
                ]);
                done();
            });
        });

        it("TC-202-5 Search for users with isActive=true", (done) => {
            chai.request(server).get("/api/user?isActive=true").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        id: 1,
                        firstName: 'Mariëtte',
                        lastName: 'van den Dullemen',
                        isActive: 1,
                        emailAdress: 'm.vandullemen@server.nl',
                        password: 'pfefejW41!',
                        phoneNumber: '0687629321',
                        roles: 'editor,guest',
                        street: 'Groenstraat 10',
                        city: 'Rotterdam',
                    }
                ]);
                done();
            });
        });

        it("TC-202-6 Search for users with existing name as searchterm", (done) => {
            chai.request(server).get("/api/user?name=Chevy").send({
            })
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                assert.deepEqual(result, [
                    {
                        id: 2,                          
                        firstName: 'Chevy',             
                        lastName: 'Rietveld',           
                        isActive: 0,                    
                        emailAdress: 'chevy@gmail.com', 
                        password: 'wvqOertE5!',         
                        phoneNumber: '0651160300',      
                        roles: 'editor,guest',          
                        street: 'Van Wenastraat 31',    
                        city: 'Giessenburg'
                    }
                ]);
                done();
            });
        });
    });

    describe("UC-206 Deleting a user /api/user", ()=> {

        before((done) => {
            dbconnection.getConnection(function(err, connection) {
                if (err) throw err;
                connection.query('DELETE FROM user;', (error, result, field) => {
                    connection.query('ALTER TABLE user AUTO_INCREMENT = 1;', (error, result, field) => {
                        connection.query('INSERT INTO user (id, firstName, lastName, street, city, isActive, emailAdress, password, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);', [1, 'Mariëtte', 'van den Dullemen', 'Groenstraat 10', 'Rotterdam' , 1, 'm.vandullemen@server.nl', 'pfefejW41!', '0687629321'], (error, result, field) => {
                            connection.release();
                            done();
                        });
                    });
                });
            });
        });

        it("TC-206-1 User requested to be deleted doesnt exist", (done) => {
            chai.request(server).delete("/api/user/999")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(400)
                result.should.be.a("string").that.equals("User with ID 999 not found, and could not be deleted");
                done();
            });
        });

        //cant do this one yet as token/login function isnt implemented yet, so its told to be skipped
        xit("TC-206-2 User isnt logged in when trying to delete", (done) => {
            chai.request(server).delete("/api/user/1")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(401)
                result.should.be.a("string").that.equals("Cant delete user, as you are not logged in");
                done();
            });
        });

        //cant do this one yet as token/login function isnt implemented yet, so its told to be skipped
        xit("TC-206-3 User isnt the owner of the user they are trying to delete", (done) => {
            chai.request(server).delete("/api/user/1")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(401)
                result.should.be.a("string").that.equals("Cant delete user, as you are not the owner of this user");
                done();
            });
        });

        it("TC-206-4 User succesfully deleted", (done) => {
            chai.request(server).delete("/api/user/1")
            .end((err,res) => {
                res.should.be.an("object")
                let {status, result} = res.body;
                status.should.equals(200)
                result.should.be.a("string").that.equals("User with ID 1 succesfully deleted");
                done();
            });
        });
    });
});