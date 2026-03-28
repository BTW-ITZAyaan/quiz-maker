# Online Quiz Maker

An interactive full-stack web application that allows users to create quizzes, take quizzes, and get instant results. This project includes user authentication, quiz creation, quiz listing, quiz participation, and score display.

## Features

- User registration and login
- Create a new quiz with multiple-choice questions
- Add multiple options and mark the correct answer
- View all available quizzes
- Take quizzes one question at a time
- Get instant final score after quiz submission
- View correct answers after completing the quiz
- Responsive design for desktop and mobile devices

## Tech Stack

### Frontend
- React
- CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

## Project Structure

```bash
quiz-maker/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
└── backend/
    ├── server.js
    └── package.json


1. Clone the repository
bash
git clone https://github.com/BTW-ITZAyaan/quiz-maker.git
cd quiz-maker
2. Setup MySQL database
Open MySQL command line and run:

sql
CREATE DATABASE IF NOT EXISTS quiz_maker;
USE quiz_maker;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
3. Run backend
Go to the backend folder:

bash
cd backend
npm init -y
npm install express mysql2 cors
node server.js
4. Run frontend
Open a new terminal and go to the frontend folder:

bash
cd frontend
npm install
npm run dev
Usage
Register a new account

Login with your credentials

Create a quiz by adding questions and options

Browse available quizzes

Start a quiz and answer questions one by one

Submit the quiz and view your final result

Future Improvements
Password hashing

JWT authentication

Timer-based quiz system

Edit and delete quizzes

Admin dashboard

Leaderboard

Category-based quizzes

Author
Ayaan Kuhar

GitHub: BTW-ITZAyaan

text

## Small fix

In the README, if your actual GitHub username is slightly different, replace this line:

```md
git clone https://github.com/BTW-ITZAyaan/quiz-maker.git
with your exact final repo URL.

