"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class quiz extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      quiz.belongsTo(models.user);
    }
  }
  quiz.init(
    {
      editionNumber: DataTypes.STRING,
      date: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "quiz",
    }
  );
  return quiz;
};
