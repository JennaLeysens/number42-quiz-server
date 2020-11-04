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
    const { editionNumber, date, teamMembers, teamName } = req.body;
    if (!editionNumber || !date || !teamMembers) {
      return res
        .status(400)
        .send({ message: "Please complete all the fields to create a quiz" });
    }
    const newQuiz = await Quiz.create({
      editionNumber,
      date,
      teamMembers,
      teamName,
      userId: user.id,
    });
    const round = await Round.create({
      roundNumber: 1,
      quizId: newQuiz.id,
    });
    res.status(201).send({ message: "Quiz added", newQuiz, round });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.post("/round", authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.body;
    const currentQuiz = await Quiz.findByPk(quizId, { include: Round });
    const newRound = await Round.create(
      {
        roundNumber: currentQuiz.rounds.length + 1,
        quizId: currentQuiz.id,
      },
      { returning: true }
    );

    return res.status(201).send({ message: "Round added", newRound });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.post("/answer", authMiddleware, async (req, res) => {
  try {
    const { answer, points, roundId, quizId } = req.body;
    console.log(req.body);
    if (typeof answer !== "string") {
      return res.status(400).send({
        message: "Please complete all the fields to create an answer",
      });
    }
    const newAnswer = await Answer.create(
      {
        answer,
        points,
        roundId,
        quizId,
      },
      { returning: true }
    );

    return res.status(201).send({ message: "Answer added", newAnswer });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/quizzes", authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    const quizzes = await Quiz.findAll({ where: { userId: user.id } });
    if (!quizzes) {
      return res.status(401).send({
        message: "Quizzes not found",
      });
    }
    res.json(quizzes);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/quizzes/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    console.log(id);
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Round,
          include: { model: Answer },
        },
      ],
    });
    if (!quiz) {
      return res.status(404).send({
        message: "Quiz not found",
      });
    }
    res.json(quiz);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.patch("/update", authMiddleware, async (req, res, next) => {
  try {
    const { answer, points, roundId, quizId, answerId } = req.body;
    const id = answerId;
    console.log(id);
    const quizAnswer = await Answer.findByPk(id, {});
    console.log(req.body);
    const updatedAnswer = await quizAnswer.update(
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
        .send({ message: "Please complete all the fields update an answer" });
    }
    res.status(201).send({ message: "Answer updated", updatedAnswer });
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

// router.delete("/quizzes/:id", authMiddleware, async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     // const user = req.user;
//     const quizAnswer = await Answer.findByPk(id);
//     // if (user.id === quizAnswer.userId) {
//     const deletedAnswer = await quizAnswer.destroy();
//     res.status(201).send({ message: "Answer deleted", deletedAnswer });
//     // } else {
//     //   return res
//     //     .status(400)
//     //     .send("You are not authorized to delete this answer");
//     // }
//   } catch (e) {
//     console.log(e.message);
//     next(e);
//   }
// });

router.delete("/quizzes/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    // const user = req.user;
    const quiz = await Quiz.findByPk(id);
    // if (user.id === quizAnswer.userId) {
    const deletedQuiz = await quiz.destroy();
    res.status(201).send({ message: "Quiz deleted", deletedQuiz });
    // } else {
    //   return res
    //     .status(400)
    //     .send("You are not authorized to delete this answer");
    // }
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
  res.status(200).send({ ...req.user.dataValues });
});

module.exports = router;
