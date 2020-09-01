"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("quizzes", "userId", {
      type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("rounds", "quizId", {
      type: Sequelize.INTEGER,
      references: {
        model: "quizzes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("answers", "roundId", {
      type: Sequelize.INTEGER,
      references: {
        model: "rounds",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("answers", "quizId", {
      type: Sequelize.INTEGER,
      references: {
        model: "quizzes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("quizzes", "userId");
    await queryInterface.removeColumn("rounds", "quizId");
    await queryInterface.removeColumn("answers", "roundId");
    await queryInterface.removeColumn("answers", "quizId");
  },
};
