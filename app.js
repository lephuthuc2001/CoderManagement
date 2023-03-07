var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

const Task = require("./models/task");
const User = require("./models/user");

const errorController = require("./controllers/error");
const indexRouter = require("./routes/index");

var app = express();

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connect to database");
  // const demoUsers = [];
  // const demoTasks = [];

  // for (let i = 0; i < 200; i++) {
  //   demoUsers.push({
  //     name: faker.name.fullName(),
  //     department: faker.helpers.arrayElement([
  //       "Marketing",
  //       "Sales",
  //       "Human Resources",
  //       "Customer Service",
  //       "Tech",
  //     ]),
  //     tasks: [],
  //   });

  //   demoTasks.push({
  //     name: faker.company.bs(),
  //     status: faker.helpers.arrayElement([
  //       "working",
  //       "review",
  //       "done",
  //       "archive",
  //     ]),
  //     description: faker.lorem.sentences(4),
  //     assignees: [],
  //   });
  // }
  // User.insertMany(demoUsers);
  // Task.insertMany(demoTasks);
});

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use(errorController);

module.exports = app;
