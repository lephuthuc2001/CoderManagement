const express = require("express");
const { body, validationResult } = require("express-validator");

const usersController = require("../controllers/user");
const tasksController = require("../controllers/task");

const router = express.Router();
//USERS

/**
 * @route GET api/users
 * @description Get a list of users
 * @access public
 * @allowedQueries department,name,limit
 */
router.get("/users", usersController.getUsers);

/**
 * @route POST api/users
 * @description Create new user
 * @access private
 * @requiredBody name,department
 */
router.post(
  "/users",
  ...usersController.validatePostUsers,
  usersController.postUsers
);

/**
 * @route Get api/users/:userId
 * @description getTasks for a user
 * @access private
 */

router.get(
  "/users/:userId",
  ...usersController.validateUserId,
  usersController.getTasksPerUser
);

//TASKS
/**
 * @route POST api/tasks
 * @description create Task
 * @access private
 * @requiredBody name,department
 */
router.post(
  "/tasks",
  ...tasksController.validatePostTasks,
  tasksController.postTasks
);
/**
 * @route GET api/tasks
 * @description get a list of task
 * @access private
 * @allowedQueries name,status
 */
router.get(
  "/tasks",
  ...tasksController.validateQueries,
  tasksController.getTasks
);
/**
 * @route GET api/tasks/:taskId
 * @description get single task
 * @access private
 * @requiredParams tasksID
 */

router.get(
  "/tasks/:taskId",
  tasksController.validateTaskId,
  tasksController.getTaskById
);

/**
 * @route PUT api/tasks/:taskId
 * @description update status of a task
 * @access private
 * @requiredParams tasksID
 * @requiredBody status
 */
router.put(
  "/tasks/:taskId",
  ...tasksController.validateTaskId,
  ...tasksController.validateTaskStatus,
  tasksController.updateStatus
);
/**
 * @route PUT api/assignment/:taskId
 * @description assign or unassign a user in a task
 * @access public
 * @requiredParams tasksID
 * @requiredBody userId
 */
router.put(
  "/assignment/:taskId",
  ...tasksController.validateTaskId,
  ...tasksController.validateAssignment,
  tasksController.assignTasks
);
/**
 * @route DELETE api/tasks/:taskId
 * @description hide a task
 * @access private
 * @requiredParams tasksID
 */

router.delete(
  "/tasks/:taskId",
  ...tasksController.validateTaskId,
  tasksController.deleteTask
);

module.exports = router;
