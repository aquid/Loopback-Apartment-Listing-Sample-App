'use strict';
let _ = require('underscore');
let path = require('path');
let fileName = path.basename(__filename, '.js'); // gives the filename without the .js extension
const logger = require('sp-json-logger')({fileName: 'server:boot:' + fileName});

module.exports = function (app) {
  let Role = app.models.Role;
  /*
   * Dynamic role resolvers for student, agent
   */
  let roles = ['student', 'agent'];
  _.each(roles, function (eachRole) {
    Role.registerResolver(eachRole, function (role, context, cb) {
      function reject(err) {
        if (err) {
          return cb(err);
        }
        cb(null, false);
      }

      let currentUserId = context.accessToken.userId;
      let currentCompany = context.modelId;
      if (!currentUserId) {
        // Do not allow unauthenticated users to proceed
        return reject();
      }
      else {
        app.models.MyUsers.findById(currentUserId, {
          include: {
            relation: 'roles',
            scope: {
              fields: ['name'] // only include the role name and id
            }
          }
        })
          .then(function (userModelInstance) {
            let isValidUser = _.findWhere(userModelInstance.roles(), {name: eachRole});
            if(!isValidUser) {
              logger.error({
                message: 'Not a valid user',
                functionName:'role_resolver'
              });
              return reject();
            }
            else {
              // log.debug('User is accessing as ' + eachRole.name);
              return cb(null, true);
            }
          })
          .catch(function (error) {
            logger.error({
              error: error,
              message: 'Not a valid user',
              functionName:'role_creation'
            });
            cb(error);
          });
      }
    });
  });

};
