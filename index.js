const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

let database = [];
let id = 0;

//logging any called methods
app.all("*", (req, res, next) => {
  const method = req.method;
  console.log(`Method ${method} called`);
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    result: "Hello World!",
  });
});

//getting a users profile, if it has a valid JWT token (endpoint not realized yet)
app.all("/api/user/profile", (req, res) => {
  res.status(401).json({
    status: 401,
    result: "Cant fetch user profile as this functionality has not been realized yet",
  });
});

//handling a post request for a new user
app.post("/api/user", (req, res) => {
  let user = req.body;
  let sameEmailUser = database.filter((item) => item.emailAdress == user.emailAdress);
  console.log(sameEmailUser);
  if(sameEmailUser < 1){
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
    res.status(401).json({
      status: 401,
      result: `Could not add user, a user with the following email already exists: ${user.emailAdress}`,
    });
  }

});

//getting a user by id
app.get("/api/user/:userId", (req, res, next) => {
  const userId = req.params.userId;
  console.log(`User with ID ${userId} requested`);
  let user = database.filter((item) => item.id == userId);
  if (user.length > 0) {
    res.status(200).json({
      status: 200,
      result: user,
    });
  } else {
    res.status(401).json({
      status: 401,
      result: `User with ID ${userId} could not be found`,
    });
  }
});

//deleting a user by id
app.delete("/api/user/:userId", (req, res, next) => {
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
    res.status(401).json({
      status: 401,
      result: `User with ID ${userId} not found, and could not be deleted`,
    });
  }
})

//updating a user by id
app.put("/api/user/:userId", (req, res, next) => {
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
    res.status(401).json({
      status: 401,
      result: `User with ID ${userId} not found, and couldnt be updated`,
    });
  }
});

//getting all users
app.get("/api/user", (req, res, next) => {
  let user = req.body;
  for(user of database){
    console.log(user);
  }
  res.status(200).json({
    status: 200,
    result: database,
  });
});

//error page not found
app.all("*", (req, res) => {
  res.status(401).json({
    status: 401,
    result: "End-point not found",
  });
});

app.listen(port, () => {
  console.log(`Share A Meal API app listening on port ${port}`);
});
