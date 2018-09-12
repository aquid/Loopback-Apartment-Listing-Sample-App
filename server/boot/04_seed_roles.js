'use strict';

let path = require('path');
let fileName = path.basename(__filename, '.js'); // gives the filename without the .js extension
let logger = require('sp-json-logger')({fileName: 'server:boot:' + fileName});
let Promise = require('bluebird'); // jshint ignore:line

module.exports = function (app, cb) {
  let Role = app.models.Role;
  Promise.resolve()
    .then(function () {
      return Role.findOrCreate(
        {where: {name: 'student'}}, // find
        {name: 'student', description: 'students'}
      );
    })
    .then(function () {
      return Role.findOrCreate(
        {where: {name: 'agent'}}, // find
        {
          name: 'agent',
          description: 'agent with listings'
        }
      );
    })
    .then(function () {
      logger.info({
        message: 'Roles created successfully',
        functionName: 'role_creation',
      });
      return cb();
    })
    .catch(function (error) {
      logger.error({
        error:error,
        message: 'Error in creating roles',
        functionName:'role_creation'
      });
      return cb(error);
    });
};
