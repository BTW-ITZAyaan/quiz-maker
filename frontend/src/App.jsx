import React, { useEffect, useState } from "react";
import "./index.css";

const API = "http://localhost:5000";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    questions: [
      {
        question_text: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      }
    ]
  });

  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [resultDetails, setResultDetails] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchQuizzes();
    const savedUser = localStorage.getItem("quizUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`${API}/quizzes`);
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.log("Failed to fetch quizzes");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData)
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Registration successful. Please login.");
      setRegisterData({ name: "", email: "", password: "" });
      setPage("login");
    } else {
      setMessage(data.error || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    });
    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      localStorage.setItem("quizUser", JSON.stringify(data.user));
      setMessage("Login successful");
      setLoginData({ email: "", password: "" });
      setPage("home");
    } else {
      setMessage(data.error || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("quizUser");
    setPage("home");
    setMessage("Logged out successfully");
  };

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        {
          question_text: "",
          options: [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false }
          ]
        }
      ]
    });
  };

  const handleQuestionChange = (qIndex, value) => {
    const updated = [...quizForm.questions];
    updated[qIndex].question_text = value;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...quizForm.questions];
    updated[qIndex].options[oIndex].option_text = value;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleCorrectOption = (qIndex, oIndex) => {
    const updated = [...quizForm.questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, index) => ({
      ...opt,
      is_correct: index === oIndex
    }));
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage("Please login first");
      setPage("login");
      return;
    }

    const payload = {
      user_id: user.id,
      title: quizForm.title,
      description: quizForm.description,
      questions: quizForm.questions
    };

    const res = await fetch(`${API}/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Quiz created successfully");
      setQuizForm({
        title: "",
        description: "",
        questions: [
          {
            question_text: "",
            options: [
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false },
              { option_text: "", is_correct: false }
            ]
          }
        ]
      });
      fetchQuizzes();
      setPage("list");
    } else {
      setMessage(data.error || "Failed to create quiz");
    }
  };

  const startQuiz = async (quizId) => {
    const res = await fetch(`${API}/quizzes/${quizId}`);
    const data = await res.json();

    if (res.ok) {
      setCurrentQuiz(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setResultDetails([]);
      setPage("takeQuiz");
    } else {
      setMessage("Failed to load quiz");
    }
  };

  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!currentQuiz) return;

    let finalScore = 0;
    const details = currentQuiz.questions.map((question) => {
      const selectedOptionId = selectedAnswers[question.id];
      const correctOption = question.options.find((opt) => opt.is_correct);
      const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
      const isCorrect = selectedOptionId === correctOption?.id;

      if (isCorrect) finalScore++;

      return {
        question: question.question_text,
        selected: selectedOption ? selectedOption.option_text : "Not answered",
        correct: correctOption ? correctOption.option_text : "",
        isCorrect
      };
    });

    setScore(finalScore);
    setResultDetails(details);
    setPage("results");

    if (user) {
      await fetch(`${API}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: currentQuiz.quiz.id,
          user_id: user.id,
          score: finalScore,
          total_questions: currentQuiz.questions.length
        })
      });
    }
  };

  const renderHome = () => (
    <div className="hero-card">
      <h1>Online Quiz Maker</h1>
      <p>Create quizzes, take quizzes, and get instant results.</p>
      <div className="button-row">
        <button onClick={() => setPage("create")}>Create Quiz</button>
        <button onClick={() => setPage("list")}>Take Quiz</button>
      </div>
    </div>
  );

  const renderRegister = () => (
    <form className="form-card" onSubmit={handleRegister}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Enter name"
        value={registerData.name}
        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Enter email"
        value={registerData.email}
        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Enter password"
        value={registerData.password}
        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
        required
      />
      <button type="submit">Register</button>
    </form>
  );

  const renderLogin = () => (
    <form className="form-card" onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Enter email"
        value={loginData.email}
        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Enter password"
        value={loginData.password}
        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
        required
      />
      <button type="submit">Login</button>
    </form>
  );

  const renderCreateQuiz = () => (
    <form className="form-card large-form" onSubmit={handleCreateQuiz}>
      <h2>Create Quiz</h2>
      <input
        type="text"
        placeholder="Quiz title"
        value={quizForm.title}
        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
        required
      />
      <textarea
        placeholder="Quiz description"
        value={quizForm.description}
        onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
        required
      />
      {quizForm.questions.map((question, qIndex) => (
        <div className="question-box" key={qIndex}>
          <h3>Question {qIndex + 1}</h3>
          <input
            type="text"
            placeholder="Enter question"
            value={question.question_text}
            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
            required
          />
          {question.options.map((option, oIndex) => (
            <div className="option-row" key={oIndex}>
              <input
                type="text"
                placeholder={`Option ${oIndex + 1}`}
                value={option.option_text}
                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                required
              />
              <label className="radio-label">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={option.is_correct}
                  onChange={() => handleCorrectOption(qIndex, oIndex)}
                />
                Correct
              </label>
            </div>
          ))}
        </div>
      ))}
      <div className="button-row">
        <button type="button" onClick={addQuestion}>
          Add Question
        </button>
        <button type="submit">Save Quiz</button>
      </div>
    </form>
  );

  const renderQuizList = () => (
    <div className="list-wrapper">
      <h2>Available Quizzes</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes available yet.</p>
      ) : (
        quizzes.map((quiz) => (
          <div className="quiz-card" key={quiz.id}>
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <small>Created by: {quiz.creator}</small>
            <button onClick={() => startQuiz(quiz.id)}>Start Quiz</button>
          </div>
        ))
      )}
    </div>
  );

  const renderTakeQuiz = () => {
    if (!currentQuiz || currentQuiz.questions.length === 0) {
      return <div className="form-card"><p>No questions found for this quiz.</p></div>;
    }

    const question = currentQuiz.questions[currentQuestionIndex];

    return (
      <div className="quiz-screen">
        <div className="quiz-top">
          <span>
            Question {currentQuestionIndex + 1}/{currentQuiz.questions.length}
          </span>
        </div>
        <div className="quiz-panel">
          <h2>{question.question_text}</h2>
          <div className="answers-grid">
            {question.options.map((option) => (
              <button
                key={option.id}
                className={
                  selectedAnswers[question.id] === option.id ? "answer-btn active" : "answer-btn"
                }
                onClick={() => handleSelectAnswer(question.id, option.id)}
              >
                {option.option_text}
              </button>
            ))}
          </div>
          <button className="next-btn" onClick={nextQuestion}>
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? "Finish Quiz" : "Next"}
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="result-card">
      <h2>Your Score: {score}/{currentQuiz?.questions.length}</h2>
      {resultDetails.map((item, index) => (
        <div className="result-item" key={index}>
          <h4>Q{index + 1}: {item.question}</h4>
          <p>Your answer: {item.selected}</p>
          <p>Correct answer: {item.correct}</p>
          <p className={item.isCorrect ? "correct-text" : "wrong-text"}>
            {item.isCorrect ? "Correct" : "Wrong"}
          </p>
        </div>
      ))}
      <button onClick={() => setPage("list")}>Back to Quiz List</button>
    </div>
  );

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo" onClick={() => setPage("home")}>
          Quiz Maker
        </div>
        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("list")}>Quizzes</button>
          <button onClick={() => setPage("create")}>Create</button>
          {!user && <button onClick={() => setPage("register")}>Register</button>}
          {!user && <button onClick={() => setPage("login")}>Login</button>}
          {user && <button onClick={logout}>Logout</button>}
        </nav>
      </header>

      {message && <div className="message-bar">{message}</div>}

      <main className="main-content">
        {page === "home" && renderHome()}
        {page === "register" && renderRegister()}
        {page === "login" && renderLogin()}
        {page === "create" && renderCreateQuiz()}
        {page === "list" && renderQuizList()}
        {page === "takeQuiz" && renderTakeQuiz()}
        {page === "results" && renderResults()}
      </main>
    </div>
  );
}
