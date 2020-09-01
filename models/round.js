"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class round extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      round.belongsTo(models.quiz);
    }
  }
  round.init(
    {
      roundNumber: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "round",
    }
  );
  return round;
};
