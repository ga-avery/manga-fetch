'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.user.hasMany(models.list);
    }
  };
  user.init({
    name: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [1, 99],
          msg: 'Name must be between 1 and 99 characters'
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [8, 99],
          msg: 'Password must be between 8 and 99 characters',
        },
      },
    },
  }, {
    sequelize,
    modelName: 'user',
  });
  user.addHook('beforeCreate', async pendingUser => {
    const hash = await bcrypt.hash(pendingUser.password, 12);
    pendingUser.password = hash;
  })
  user.prototype.validPassword = function (typedPassword) {
    const isCorrectPassword = bcrypt.compareSync(typedPassword, this.password);
    return isCorrectPassword;
  }
  user.prototype.toJSON = function () {
    const userData = this.get();
    delete userData.password;
    return userData;
  }
  return user;
};