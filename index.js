const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const userRouter = require("./src/routes/user.routes");

let database = [];
let id = 0;

//logging any called methods
app.all("*", (req, res, next) => {
  const method = req.method;
  console.log(`Method ${method} called`);
  next();
});

app.use(userRouter);

//error page not found
app.all("*", (req, res) => {
  res.status(401).json({
    status: 401,
    result: "End-point not found",
  });
});

//error handler
app.use((err,req,res,next) => {
  res.status(err.status).json(err);
});

app.listen(port, () => {
  console.log(`Share A Meal API app listening on port ${port}`);
});

module.exports = app;
