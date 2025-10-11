// File: assets/js/ai.js

// Lấy các phần tử HTML từ trang ai.html
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatHistory = document.getElementById('chat-history');
const generateQuizBtn = document.getElementById('generate-quiz-btn');
const quizContainer = document.getElementById('quiz-container');

// Xử lý sự kiện gửi câu hỏi chat
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = userInput.value;
  if (!question.trim()) return;

  appendMessage(question, 'user');
  userInput.value = '';
  const thinkingMessage = appendMessage('...', 'ai-thinking');

  try {
    const response = await fetch('/.netlify/functions/chat-rag', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    thinkingMessage.innerHTML = data.reply;
    thinkingMessage.classList.remove('ai-thinking');
  } catch (error) {
    thinkingMessage.textContent = 'Đã có lỗi xảy ra, vui lòng thử lại.';
  }
});

// Xử lý sự kiện tạo quiz
generateQuizBtn.addEventListener('click', async () => {
  quizContainer.innerHTML = `<p><em>Đang tạo câu hỏi...</em></p>`;
  try {
    const response = await fetch('/.netlify/functions/create-quiz');
    const quizData = await response.json();
    displayQuiz(quizData);
  } catch (error) {
    quizContainer.innerHTML = `<p>Lỗi tạo câu hỏi, vui lòng thử lại.</p>`;
  }
});

// Hàm hiển thị tin nhắn trong chat box
function appendMessage(text, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', `${sender}-message`);
  messageElement.textContent = text;
  chatHistory.appendChild(messageElement);
  chatHistory.scrollTop = chatHistory.scrollHeight; // Tự động cuộn xuống
  return messageElement;
}

// Hàm hiển thị quiz
function displayQuiz(quiz) {
  let optionsHTML = quiz.options.map(option =>
    `<button class="quiz-option">${option}</button>`
  ).join('');

  quizContainer.innerHTML = `
    <h3>${quiz.question}</h3>
    <div class="options-wrapper">${optionsHTML}</div>
    <p id="quiz-feedback" class="quiz-feedback"></p>
  `;

  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', (e) => {
      const feedback = document.getElementById('quiz-feedback');
      document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true); // Vô hiệu hóa các nút khác
      if (e.target.textContent === quiz.answer) {
        e.target.classList.add('correct');
        feedback.textContent = 'Chính xác!';
      } else {
        e.target.classList.add('incorrect');
        feedback.textContent = `Sai rồi! Đáp án đúng là: ${quiz.answer}`;
      }
    });
  });
}