const express = require("express");
const app = express();
const logger = require('./src/config/config').logger

require('dotenv').config()

const port = process.env.PORT;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const userRouter = require("./src/routes/user.routes");
const authRouter = require("./src/routes/auth.routes");
const mealRouter = require("./src/routes/meal.routes");

let database = [];
let id = 0;

//logging any called methods
app.all("*", (req, res, next) => {
  const method = req.method;
  logger.debug(`Method ${method} called`);
  next();
});

app.use(userRouter);
app.use(authRouter);
app.use(mealRouter);

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
  logger.debug(`Share A Meal API app listening on port ${port}`);
});

module.exports = app;
