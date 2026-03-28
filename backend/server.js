const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Chika@2007",
  database: "quiz_maker"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Quiz Maker API is running" });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Registration failed", details: err });
    }
    res.json({ message: "User registered successfully", userId: result.insertId });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Login failed" });
    }

    if (result.length > 0) {
      res.json({
        message: "Login successful",
        user: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email
        }
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });
});

app.post("/quizzes", (req, res) => {
  const { user_id, title, description, questions } = req.body;

  const quizSql = "INSERT INTO quizzes (user_id, title, description) VALUES (?, ?, ?)";
  db.query(quizSql, [user_id, title, description], (err, quizResult) => {
    if (err) {
      return res.status(500).json({ error: "Quiz creation failed", details: err });
    }

    const quizId = quizResult.insertId;

    if (!questions || questions.length === 0) {
      return res.json({ message: "Quiz created successfully", quizId });
    }

    let completedQuestions = 0;

    questions.forEach((question) => {
      const questionSql = "INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)";
      db.query(questionSql, [quizId, question.question_text], (err, questionResult) => {
        if (err) {
          return res.status(500).json({ error: "Question creation failed", details: err });
        }

        const questionId = questionResult.insertId;
        const options = question.options || [];

        if (options.length === 0) {
          completedQuestions++;
          if (completedQuestions === questions.length) {
            res.json({ message: "Quiz created successfully", quizId });
          }
          return;
        }

        let completedOptions = 0;

        options.forEach((option) => {
          const optionSql =
            "INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)";
          db.query(
            optionSql,
            [questionId, option.option_text, option.is_correct],
            (err) => {
              if (err) {
                return res.status(500).json({ error: "Option creation failed", details: err });
              }

              completedOptions++;
              if (completedOptions === options.length) {
                completedQuestions++;
                if (completedQuestions === questions.length) {
                  res.json({ message: "Quiz created successfully", quizId });
                }
              }
            }
          );
        });
      });
    });
  });
});

app.get("/quizzes", (req, res) => {
  const sql = `
    SELECT quizzes.id, quizzes.title, quizzes.description, quizzes.created_at, users.name AS creator
    FROM quizzes
    JOIN users ON quizzes.user_id = users.id
    ORDER BY quizzes.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch quizzes" });
    }
    res.json(result);
  });
});

app.get("/quizzes/:id", (req, res) => {
  const quizId = req.params.id;

  const quizSql = "SELECT * FROM quizzes WHERE id = ?";
  db.query(quizSql, [quizId], (err, quizResult) => {
    if (err || quizResult.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questionsSql = "SELECT * FROM questions WHERE quiz_id = ?";
    db.query(questionsSql, [quizId], (err, questionsResult) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch questions" });
      }

      if (questionsResult.length === 0) {
        return res.json({
          quiz: quizResult[0],
          questions: []
        });
      }

      let completed = 0;
      const finalQuestions = [];

      questionsResult.forEach((question, index) => {
        const optionsSql = "SELECT id, option_text, is_correct FROM options WHERE question_id = ?";
        db.query(optionsSql, [question.id], (err, optionsResult) => {
          if (err) {
            return res.status(500).json({ error: "Failed to fetch options" });
          }

          finalQuestions[index] = {
            ...question,
            options: optionsResult
          };

          completed++;
          if (completed === questionsResult.length) {
            res.json({
              quiz: quizResult[0],
              questions: finalQuestions
            });
          }
        });
      });
    });
  });
});

app.post("/attempts", (req, res) => {
  const { quiz_id, user_id, score, total_questions } = req.body;

  const sql =
    "INSERT INTO attempts (quiz_id, user_id, score, total_questions) VALUES (?, ?, ?, ?)";
  db.query(sql, [quiz_id, user_id, score, total_questions], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save result" });
    }
    res.json({ message: "Result saved successfully", attemptId: result.insertId });
  });
});

app.get("/results/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT attempts.id, attempts.score, attempts.total_questions, attempts.created_at, quizzes.title
    FROM attempts
    JOIN quizzes ON attempts.quiz_id = quizzes.id
    WHERE attempts.user_id = ?
    ORDER BY attempts.id DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch results" });
    }
    res.json(result);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
