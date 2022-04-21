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

//handling a post request for a new user
app.post("/api/user", (req, res) => {
  let user = req.body;
  id++;
  user = {
    id,
    ...user,
  };
  console.log(user);
  database.push(user);
  res.status(201).json({
    status: 201,
    result: database,
  });
});

//handling a get request for a user by userId
app.get("/api/user/:userId", (req, res, next) => {
  const userId = req.params.userId;
  console.log(`User with ID ${userId} requested`);
  let user = database.filter((item) => item.id == userId);
  if (user.length > 0) {
    console.log(user);
    res.status(200).json({
      status: 200,
      result: user,
    });
  } else {
    res.status(401).json({
      status: 401,
      result: `User with ID ${userId} not found`,
    });
  }
});

//deleting a user by userId
app.delete("/api/user/:userId", (req, res, next) => {
  const userId = req.params.userId;
  console.log(`User with ID ${userId} requested to be deleted`);
  let result = database.filter((item) => item.id == userId);
  if (result.length > 0) {
    let user = result[0];

    const index = database.indexOf(user);
    console.log(user);
    if (index < 0) return;

    database.splice(index, 1);

    console.log(`User with ID ${userId} has been deleted`);
    res.status(200).json({
      status: 200,
      result: user,
    });
  } else {
    res.status(401).json({
      status: 401,
      result: `User with ID ${userId} not found, and couldnt be deleted`,
    });
  }
})

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
  console.log(`Example app listening on port ${port}`);
});
