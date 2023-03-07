const User = require("../models/user");
const { AppError, sendResponse } = require("../utils");
const { body, validationResult, param } = require("express-validator");
const lodash = require("lodash");
const { isValidObjectId } = require("mongoose");

const departments = [
  "Marketing",
  "Sales",
  "Human Resources",
  "Customer Service",
  "Tech",
];

exports.getUsers = async (req, res, next) => {
  try {
    let conditions = { isDeleted: false };

    const { department, name, limit } = req.query;

    if (department) {
      conditions.department = lodash.startCase(department);
    }

    if (name) {
      let searchName = {
        $text: { $search: `\"${name}\"` },
      };
      conditions = { ...conditions, ...searchName };
    }

    const users = await User.find(conditions)
      .sort({
        createdAt: -1,
      })
      .limit(parseInt(limit))
      .select({
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        isDeleted: 0,
      });

    return sendResponse(res, 200, true, users, null, "Get users successfully");
  } catch (error) {
    next(error);
  }
};

exports.validatePostUsers = [
  body("name").notEmpty().withMessage("Name is required"),
  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .custom((value) => {
      const department = lodash.startCase(value);

      return departments.includes(department);
    })
    .withMessage(
      "Department is required and must be one of the following: Tech, Customer Service, Human Resources, Sales, and Marketing "
    ),
];

exports.postUsers = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    console.log(errors);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const newUser = {
      name: lodash.startCase(req.body.name),
      role: "Employee",
      department: lodash.startCase(req.body.department),
      tasks: [],
    };

    await User.create(newUser);

    return sendResponse(res, 200, true, newUser);
  } catch (error) {
    next(error);
  }
};
// ["Marketing", "Sales", "Human Resources", "Customer Service", "Tech"]
exports.validateUserId = [
  param("userId")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("User ID is invalid"),
];

exports.getTasksPerUser = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);
    console.log(errors);
    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const { userId } = req.params;

    const tasksPerUser = await User.findById(userId)
      .select({
        role: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        _isDeleted: 0,
      })
      .populate("tasks");

    if (!tasksPerUser) {
      throw AppError(404, "User Not Found");
    }

    return sendResponse(res, 200, true, tasksPerUser);
  } catch (error) {
    next(error);
  }
};
