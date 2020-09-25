const bcrypt = require("bcrypt");
const { Router } = require("express");
const { toJWT } = require("../auth/jwt");
const authMiddleware = require("../auth/middleware");
const User = require("../models/").user;
const { SALT_ROUNDS } = require("../config/constants");
const Quiz = require("../models").quiz;
const Round = require("../models").round;
const Answer = require("../models").answer;

const router = new Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Please provide both email and password" });
    }

    const user = await User.findOne({
      where: { email },
      include: { model: Quiz },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).send({
        message: "User with that email not found or password incorrect",
      });
    }

    delete user.dataValues["password"]; // don't send back the password hash
    const token = toJWT({ userId: user.id });
    return res.status(200).send({ token, ...user.dataValues });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "Something went wrong, sorry" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).send("Please provide an email, password and a name");
  }

  try {
    const newUser = await User.create({
      email,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
      name,
    });

    delete newUser.dataValues["password"]; // don't send back the password hash

    const token = toJWT({ userId: newUser.id });

    res.status(201).json({ token, ...newUser.dataValues });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .send({ message: "There is an existing account with this email" });
    }

    return res.status(400).send({ message: "Something went wrong, sorry" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { editionNumber, date, teamMembers } = req.body;
    const newQuiz = await Quiz.create({
      editionNumber,
      date,
      teamMembers,
      userId: user.id,
    });
    if (!editionNumber || !date || !teamMembers) {
      return res
        .status(400)
        .send({ message: "Please complete all the fields to create a quiz" });
    }
    res.status(201).send({ message: "Quiz added", newQuiz });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.post("/round", authMiddleware, async (req, res) => {
  try {
    const { roundNumber, quizId } = req.body;
    console.log(req.body);
    const newRound = await Round.create({
      roundNumber,
      quizId,
    });
    if (!roundNumber) {
      return res
        .status(400)
        .send({ message: "Please complete all the fields to create a quiz" });
    }
    res.status(201).send({ message: "Round added", newRound });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.post("/answer", authMiddleware, async (req, res) => {
  try {
    const { answer, points, roundId, quizId } = req.body;
    console.log(req.body);
    const newAnswer = await Answer.create(
      {
        answer,
        points,
        roundId,
        quizId,
      },
      { returning: true }
    );
    if (!answer) {
      return res
        .status(400)
        .send({ message: "Please complete all the fields to create a quiz" });
    }
    res.status(201).send({ message: "Answer added", newAnswer });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/quiz/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await Quiz.findByPk({
      where: { userId: req.user.id },
      include: {
        model: Answer,
      },
    });
    if (!quiz) {
      return res.status(401).send({
        message: "Quiz not found",
      });
    }
    res.json(quiz);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

// The /me endpoint can be used to:
// - get the users email & name using only their token
// - checking if a token is (still) valid
router.get("/me", authMiddleware, async (req, res) => {
  const quizzes = await Quiz.findAll({ where: { userId: req.user.id } });

  delete req.user.dataValues["password"];
  res.status(200).send({ ...req.user.dataValues, quizzes });
});

module.exports = router;
