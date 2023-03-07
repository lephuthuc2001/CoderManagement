const { sendResponse } = require("../utils");

const errorHandler = (err, req, res, next) => {
  console.log(err.message);
  return sendResponse(
    res,
    err.statusCode ? err.statusCode : 500,
    false,
    false,
    { message: err.message },
    err.isOperational ? err.errorType : "Internal Server Error"
  );
};

module.exports = errorHandler;
