const assert = require("assert");
let database = [];
let id = 0;

let controller={
    validateUser:(req,res,next)=>{
        let user = req.body;
        let { firstName, lastName, password, emailAdress } = user;
        try{
            assert(typeof firstName === "string", "First name must be a string");
            assert(typeof lastName === "string", "Last name must be a string");
            assert(typeof password === "string", "Password must be a string");
            assert(typeof emailAdress === "string", "Emailadress must be a string");
            next();
        } catch(err){
            const error={
                status: 400,
                result: err.message
            };

            next(error);
        }
    },
    addUser:(req,res,next)=>{
        let user = req.body;
        let sameEmailUser = database.filter((item) => item.emailAdress == user.emailAdress);
        console.log(sameEmailUser);
        if (sameEmailUser < 1) {
            id++;
            user = {
                id,
                ...user,
            };
            database.push(user);
            res.status(201).json({
                status: 201,
                result: user,
            });
        } else {
            const error={
                status: 401,
                result: `Could not add user, a user with the following email already exists: ${user.emailAdress}`,
            };
            next(error);
        }
    },
    getAllUsers:(req,res)=>{
        let user = req.body;
        for (user of database) {
            console.log(user);
        }
        res.status(200).json({
            status: 200,
            result: database,
        });
    },
    getUserById:(req,res,next)=>{
        const userId = req.params.userId;
        console.log(`User with ID ${userId} requested`);
        let user = database.filter((item) => item.id == userId);
        if (user.length > 0) {
            res.status(200).json({
            status: 200,
            result: user,
        });
    } else {
        const error={
            status: 401,
            result: `User with ID ${userId} could not be found`,
        };
        next(error);
    }
    },
    deleteUser:(req,res,next)=>{
        const userId = req.params.userId;
        console.log(`User with ID ${userId} requested to be deleted`);
        let result = database.filter((item) => item.id == userId);
        if (result.length > 0) {
            let user = result[0];
            const index = database.indexOf(user);
            if (index < 0) return;
            database.splice(index, 1);
            res.status(201).json({
                status: 201,
                result: `User with ID ${userId} has been deleted`,
            });
        } else {
            const error={
                status: 401,
                result: `User with ID ${userId} not found, and could not be deleted`,
            };
            next(error);
        }
    },
    updateUser:(req,res,next)=>{
        const userId = req.params.userId;
        const id = userId;
        const updateUser = req.body;
        console.log(`User with ID ${userId} requested to be updated`);
        let oldUser = database.filter((item) => item.id == userId);
        if (oldUser.length > 0) {
            const index = database.indexOf(oldUser[0]);
            user = {
                id,
                ...updateUser,
            };
            database[index] = user;
            res.status(201).json({
                status: 201,
                result: user,
            });
        } else {
            const error={
                status: 401,
                result: `User with ID ${userId} not found, and couldnt be updated`,
            };
            next(error);
        }
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