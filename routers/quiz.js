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
