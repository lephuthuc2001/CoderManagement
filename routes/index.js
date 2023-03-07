const { AppError } = require("../utils");
const api = require("./management.api");
var express = require("express");
var router = express.Router();

router.use(api);

module.exports = router;
