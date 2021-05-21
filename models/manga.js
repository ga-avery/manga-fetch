'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class manga extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  manga.init({
    manga_id: DataTypes.STRING,
    folder_location: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'manga',
  });
  return manga;
};