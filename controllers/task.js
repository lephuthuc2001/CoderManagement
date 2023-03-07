const Task = require("../models/task");
const User = require("../models/user");
const { AppError, sendResponse } = require("../utils");
const { body, validationResult, query, param } = require("express-validator");
const { isValidObjectId } = require("mongoose");

const lodash = require("lodash");

const taskStatus = ["pending", "working", "review", "done", "archive"];

exports.validatePostTasks = [
  body("name").notEmpty().withMessage("Task name is required"),
  body("description").notEmpty().withMessage("Task description is required"),
];

exports.postTasks = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const newTask = {
      name: req.body.name,
      description: req.body.description,
      status: "pending",
      assignees: [],
    };

    await Task.create(newTask);

    return sendResponse(res, 200, true, newTask);
  } catch (error) {
    next(error);
  }
};

exports.validateQueries = [
  query("status")
    .custom((value) => {
      if (value) {
        return taskStatus.includes(lodash.lowerCase(value));
      } else {
        return true;
      }
    })
    .withMessage(
      "Task status is invalid. Valid values are pending, working, review, done, and archive"
    ),
];

exports.getTasks = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    let conditions = { isDeleted: false };

    const { status, name, limit } = req.query;

    if (status) {
      conditions.status = lodash.lowerCase(status);
    }

    if (name) {
      conditions = {
        ...conditions,
        $text: { $search: name },
      };
    }

    const tasks = await Task.find(conditions)
      .sort({
        createdAt: -1,
        updatedAt: -1,
      })
      .limit(parseInt(limit))
      .select({
        createdAt: 0,
        __v: 0,
        updatedAt: 0,
        isDeleted: 0,
      });

    return sendResponse(res, 200, true, tasks);
  } catch (error) {
    next(error);
  }
};

exports.validateTaskId = [
  param("taskId")
    .custom((value) => {
      return isValidObjectId(value);
    })
    .withMessage("Task ID is invalid"),
];

exports.getTaskById = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate("assignees").select({
      __v: 0,
    });

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    if (task.isDeleted) {
      throw new AppError(404, "This task is deleted");
    }

    return sendResponse(res, 200, true, task);
  } catch (error) {
    next(error);
  }
};

exports.validateTaskStatus = [
  body("status")
    .notEmpty()
    .withMessage("Task status is required.")
    .custom((value) => {
      if (value) {
        return taskStatus.includes(lodash.lowerCase(value));
      } else {
        return true;
      }
    })
    .withMessage(
      "Task status is invalid. Valid values are pending, working, review, done, and archive"
    ),
];

exports.updateStatus = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId).populate("assignees").select({
      status: 1,
    });

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    if (task.isDeleted) {
      throw new AppError(404, "Can not update a deleted task");
    }

    const currentTaskStatus = task.status;

    let errorMessage;

    if (status === currentTaskStatus) {
      errorMessage = `Current status should be different from updated status. Same status ${status}`;
      throw new AppError(400, errorMessage);
    }

    if (currentTaskStatus === "done") {
      if (status !== "archive") {
        errorMessage = `Status done can only be updated to status archive`;
        throw new AppError(400, errorMessage);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status,
      },
      {
        new: true,
      }
    )
      .populate("assignees")
      .select({
        isDeleted: 0,
        __v: 0,
        createdAt: 0,
      });

    return sendResponse(res, 200, true, updatedTask);
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate("assignees").select({
      isDeleted: 1,
    });

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    if (task.isDeleted) {
      throw new AppError(404, "This task is already deleted");
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    )
      .populate("assignees")
      .select({
        __v: 0,
        createdAt: 0,
      });
    return sendResponse(res, 200, true, updatedTask);
  } catch (error) {
    next(error);
  }
};

exports.validateAssignment = [
  body("isAssign")
    .notEmpty()
    .withMessage("Specifying assign or unassign is required")
    .custom((value) => typeof value === "boolean")
    .withMessage("isAssign field requires a boolean value"),
  body("assignees")
    .custom((assignees) => {
      if (!assignees || assignees.length === 0) {
        return false;
      }
      return true;
    })
    .withMessage("Assignees are required")
    .custom((assignees) => Array.isArray(assignees))
    .withMessage("An array of assignees is required")
    .custom((assignees) => {
      for (assignee of assignees) {
        if (!isValidObjectId(assignee)) {
          return false;
        }
      }
      return true;
    })
    .withMessage("There is one or more invalid assignee Id in assignees list"),
];

exports.assignTasks = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);

    if (errors.length > 0) {
      throw new AppError(404, errors[0].msg);
    }

    const { taskId } = req.params;

    let { isAssign, assignees } = req.body;

    const task = await Task.findById(taskId).select("assignees");

    if (!task) {
      throw new AppError(404, "Task not found");
    }

    if (task.isDeleted) {
      throw new AppError(404, "This task is already deleted");
    }

    const currentAssignees = task.assignees.map((a) => a.valueOf());

    let updatedAssignees = [...currentAssignees];

    if (isAssign) {
      console.log("ASSIGN");
      for (assignee of assignees) {
        if (!currentAssignees.includes(assignee)) {
          updatedAssignees.push(assignee);
        }
      }
    } else {
      console.log("UNASSIGN");
      for (assignee of assignees) {
        if (currentAssignees.includes(assignee)) {
          updatedAssignees = updatedAssignees.filter((a) => a !== assignee);
        }
      }
    }
    console.log(updatedAssignees);
    /// update tasks of users collections

    console.log(currentAssignees);
    const unAssignedusers = currentAssignees.filter(
      (a) => !updatedAssignees.includes(a)
    );

    for (assignee of isAssign ? updatedAssignees : unAssignedusers) {
      const assigneeInfo = await User.findById(assignee).select({
        tasks: 1,
      });

      console.log(assigneeInfo);

      const tasksPerAssignee = assigneeInfo.tasks.map((task) => task.valueOf());

      let updatedTasksPerAssignee;

      if (isAssign) {
        updatedTasksPerAssignee = tasksPerAssignee.includes(taskId)
          ? [...tasksPerAssignee]
          : [...tasksPerAssignee, taskId];
      } else {
        updatedTasksPerAssignee = !tasksPerAssignee.includes(taskId)
          ? [...tasksPerAssignee]
          : updatedTasksPerAssignee
          ? updatedTasksPerAssignee.filter((task) => task !== taskId)
          : [];
      }

      console.log(updatedTasksPerAssignee);

      await User.updateOne(
        { _id: assignee },
        { $set: { tasks: updatedTasksPerAssignee } }
      );

      console.log("DONE update tasks for users");
    }

    ///update assignees of tasks collections
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          assignees: updatedAssignees,
        },
      },
      {
        new: true,
      }
    ).populate("assignees");

    return sendResponse(res, 200, true, updatedTask);
  } catch (error) {
    next(error);
  }
};
/*
 {
  isAssign:true,
  userId:"..dasdasd"
 }

 {isAssign,userId} = req.body
 {taskId} = req.params
 */
