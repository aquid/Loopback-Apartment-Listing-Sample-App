'use strict';
const Promise = require('bluebird');
const path = require('path');
const fileName = path.basename(__filename, '.js'); // gives the filename without the .js extension
const logger = require('sp-json-logger')({fileName: 'common:models:' + fileName});
const Joi = Promise.promisifyAll(require('joi'));
const validate = Promise.promisify(require('joi').validate);
const _ = require('underscore');

module.exports = function(Myusers) {

  Myusers.on('attached', () => {

    /**
     *
     * Myusers.Signup
     *
     * @memberOf Myusers
     * @param {string} email -- email
     * @param {string} name -- name of the user
     * @param {string} username -- username of the user
     * @param {string} picture -- profile picture of the user
     * @param {string} username -- username which can be used to login
     * @param {string} birthday -- birthday
     * @param {string} roles -- roles of the user
     * @param {string} password -- password of the user
     *
     * @description -
     * This method expects above params for creating a  user
     * Method simultaneously also adds all kinds of roles to this user created
     * Method creates roleMappings between user and roles using the `assignRoles` method.
     */
    Myusers.remoteMethod('Signup', {
      accepts: [
        {arg: 'data', type: 'object', required: true, http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'}
      ],
      http: {path: '/signup', verb: 'post'},
      returns: {type: 'string', root: true}
    });

    Myusers.Signup = function (data, options, cb) {
      logger.debug({
        options: options,
        data: data,
        message: 'initiating sign-up',
        functionName: 'signup'
      });

      let validObjectSchema = Joi.object().keys({
        'email': Joi.string().email().required(),
        'name': Joi.string().max(100).required(),
        'username': Joi.string().max(40).required(),
        'picture': Joi.string().optional(),
        'roles': Joi.array().items(
          Joi.string().valid(
            'student',
            'agent'
          )
        ).required(),
        'password': Joi.string()
          .min(8)
          .max(20)
          .required()
      });

      let userCreated = {};

      validate(data, validObjectSchema)
        .catch((error) => {
          logger.error({
            options: options,
            error: error,
            message: 'Error in validating signup object',
            functionName: 'Signup'
          });

          return Promise.reject({
            statusCode: 400,
            property: error.details[0].path,
            message: error.details[0].message
          });
        })
        .then(function () {
          logger.debug({
            options: options,
            message: 'Validated data for sign up successfully',
            functionName: 'signup'
          });
          return Myusers.create(data);
        })
        .then(function (userInstance) {
          logger.debug({
            options: options,
            employeeInstance: userInstance,
            message: 'Created this employee for the company',
            functionName: 'signup'
          });

          userCreated = userInstance;

          let rolesToAssign = ['student'];
          return Myusers.AssignRoles(userInstance.id, rolesToAssign, options);
        })
        .then(function () {
          cb(null, userCreated);
        })
        .catch(function (err) {
          logger.error({
            options: options,
            error: err,
            message: 'Error creating company, rolling back creations',
            functionName: 'signup'
          });
          if (!_.isEmpty(userCreated)) {
            return Myusers.deleteById(userCreated.id)
              .then(function () {
                return cb(err);
              })
              .catch(function (anotherError) {
                logger.error({
                  options: options,
                  anotherError: anotherError,
                  message: 'anotherError',
                  functionName: 'signup'
                });
                return cb(anotherError);
              });
          }
          else {
            logger.error({
              options: options,
              error: err,
              message: 'Error before creation of user',
              functionName: 'signup'
            });
            return cb(err);
          }
        });
    };


    /**
     * @description - This function is used to assign roles to users
     * @param id
     * @param rolesToAssign
     * @param options
     * @return {Promise}
     * @constructor
     */
    Myusers.AssignRoles = function (id, rolesToAssign, options) {
      logger.debug({
        options: options,
        id: id,
        rolesToAssign: rolesToAssign,
        message: 'Assign Roles',
        functionName: 'assignRoles'
      });

      let Role = Myusers.app.models.Role;
      let RoleMapping = Myusers.app.models.RoleMapping;
      let orConditions = [];

      rolesToAssign.forEach(function (eachRole) {
        orConditions.push({name: eachRole});
      });

      let validObjectSchema = Joi.object().keys({
        'id': Joi.string().required(),
        'rolesToAssign': Joi.array().min(1).items(Joi.string().required()),
      });

      let data = {id: JSON.stringify(id), rolesToAssign: rolesToAssign};
      return validate(data, validObjectSchema)
        .catch(function (error) {
          logger.error({
            options: options,
            error: error,
            message: 'Error in validating assignRoles object',
            functionName: 'assignRoles'
          });
          return Promise.reject({
            statusCode: 400,
            property: error.details[0].path,
            message: error.details[0].message
          });
        })
        .then(function () {
          return Role.find({
            where: {
              or: orConditions
            }
          });
        })
        .then(function (roles) {
          return Promise.map(roles, function (eachRole) {
            logger.debug({
              options: options,
              assigningRole: eachRole.name,
              message: 'Assigning role',
              functionName: 'assignRoles'
            });
            return RoleMapping.upsert({roleId: eachRole.id, principalId: id});
          });
        })
        .then(function (result) {
          logger.info({
            result: result,
            message: 'Finished assigning roles to user',
            functionName: 'assignRoles'
          });
          return Promise.resolve(result);
        })
        .catch(function (error) {
          logger.error({
            options: options,
            error: error,
            message: 'Error assigning roles',
            functionName: 'assignRoles'
          });
          return Promise.reject(error);
        });
    };

  });
};
