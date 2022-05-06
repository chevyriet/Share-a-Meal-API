const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
let database = [];

chai.should();
chai.use(chaiHttp);

describe("Manage Users /api/user",() => {
    describe("UC-201 add users /api/user", ()=> {
        beforeEach((done) => {
            database = [];
            done();
        });

        it(" TC-201-1 When a required input is missing, a valid error should be returned", (done) => {
            chai.request(server).post("/api/user").send({
                //firstName ontbreekt
                lastName: "Rietveld",
                street: "Van Wenastraat 31",
                city: "Giessenburg",
                password: "berOertE5!",
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
    });
});