module.exports = function(app) {
  let mongodb = app.datasources.mongoDb;
  let ObjectID = mongodb.connector.getDefaultIdType();
  let RoleMapping = app.models.RoleMapping;
  let MyUsers = app.models.MyUsers;
  let Role = app.models.Role;

  RoleMapping.defineProperty('principalId', {type: ObjectID});
  RoleMapping.belongsTo(MyUsers);
  Role.hasMany(MyUsers, {through: RoleMapping, foreignKey: 'roleId'});
  MyUsers.hasMany(RoleMapping, {foreignKey: 'principalId'});
  MyUsers.hasMany(Role, {as: 'roles', through: RoleMapping, foreignKey: 'principalId'});
};
