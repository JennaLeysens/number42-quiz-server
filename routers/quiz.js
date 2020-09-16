const { Router } = require("express");
const Quiz = require("../models").quiz;
const router = new Router();

router.get("/", async (req, res, next) => {
  try {
    const quizzes = await Quiz.findAll({});
    res.json(quizzes);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await Quiz.findByPk(id, {});
    if (!quiz) {
      return res.status(401).send({
        message: "Quiz not found",
      });
    }
    res.json(recipe);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});
