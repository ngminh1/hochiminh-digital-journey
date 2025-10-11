// File: assets/js/ai.js

// --- XỬ LÝ HIỆU ỨNG REVEAL ON SCROLL ---
// Logic này được thêm vào để thay thế cho file reveal.js đang trống.
// Nó sẽ làm các module AI hiện ra mượt mà khi người dùng cuộn trang.
function handleRevealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  const windowHeight = window.innerHeight;
  // Điểm kích hoạt hiệu ứng (cách đáy màn hình 100px)
  const revealTriggerPoint = 100; 

  reveals.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    if (elementTop < windowHeight - revealTriggerPoint) {
      element.classList.add('active');
    }
  });
}

// Gọi hàm khi tải trang và mỗi khi cuộn
window.addEventListener('scroll', handleRevealOnScroll);
// Chạy lần đầu khi nội dung đã tải xong để kiểm tra các phần tử đã ở trong tầm nhìn
document.addEventListener('DOMContentLoaded', handleRevealOnScroll);


// --- Lấy các phần tử HTML ---
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatHistory = document.getElementById('chat-history');
const generateQuizBtn = document.getElementById('generate-quiz-btn');
const quizContainer = document.getElementById('quiz-container');

// --- Xử lý sự kiện cho Chatbot ---
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = userInput.value;
  if (!question.trim()) return;

  appendMessage(question, 'user');
  userInput.value = '';
  const thinkingMessage = appendMessage('Đang suy nghĩ...', 'ai-thinking');

  try {
    const response = await fetch('/.netlify/functions/chat-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        throw new Error(`Lỗi mạng: ${response.status}`);
    }

    const data = await response.json();
    thinkingMessage.textContent = data.reply;
    thinkingMessage.classList.remove('ai-thinking');
    thinkingMessage.classList.add('ai-message');
  } catch (error) {
    thinkingMessage.textContent = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
  }
});

// --- Xử lý sự kiện cho Quiz ---
generateQuizBtn.addEventListener('click', async () => {
  quizContainer.innerHTML = `<p><em>Đang tạo câu hỏi mới...</em></p>`;
  generateQuizBtn.disabled = true; // Vô hiệu hóa nút trong khi chờ

  try {
    const response = await fetch('/netlify/functions/create-quiz');
     if (!response.ok) {
        throw new Error(`Lỗi mạng: ${response.status}`);
    }
    const quizData = await response.json();
    displayQuiz(quizData);
  } catch (error) {
    quizContainer.innerHTML = `<p>Lỗi tạo câu hỏi, vui lòng thử lại.</p>`;
  } finally {
      generateQuizBtn.disabled = false; // Bật lại nút sau khi xong
  }
});


// --- Các hàm phụ trợ ---

/**
 * Hàm thêm tin nhắn vào khung chat
 * @param {string} text - Nội dung tin nhắn
 * @param {string} sender - 'user' hoặc 'ai'
 * @returns {HTMLElement} - Phần tử tin nhắn đã được tạo
 */
function appendMessage(text, sender) {
  const messageElement = document.createElement('div');
  // Thêm class chung và class riêng cho người gửi
  messageElement.classList.add('chat-message', `${sender}-message`);
  messageElement.textContent = text;
  chatHistory.appendChild(messageElement);
  chatHistory.scrollTop = chatHistory.scrollHeight; // Tự động cuộn xuống tin nhắn mới nhất
  return messageElement;
}

/**
 * Hàm hiển thị câu hỏi và các lựa chọn quiz
 * @param {object} quiz - Đối tượng quiz có chứa question, options, answer
 */
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
      const allOptions = document.querySelectorAll('.quiz-option');

      // Vô hiệu hóa tất cả các nút sau khi chọn
      allOptions.forEach(btn => btn.disabled = true);

      if (e.target.textContent === quiz.answer) {
        e.target.classList.add('correct');
        feedback.textContent = 'Chính xác!';
        feedback.style.color = '#28a745';
      } else {
        e.target.classList.add('incorrect');
        feedback.textContent = `Sai rồi! Đáp án đúng là: "${quiz.answer}"`;
        feedback.style.color = '#dc3545';
        // Hiển thị đáp án đúng
         allOptions.forEach(btn => {
            if(btn.textContent === quiz.answer) {
                btn.classList.add('correct');
            }
         });
      }
    });
  });
}

