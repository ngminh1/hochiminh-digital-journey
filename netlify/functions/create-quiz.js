const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  try {
    const knowledgePath = path.resolve(__dirname, '../../data/knowledge.json');
    const knowledgeBase = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
    const randomDoc = knowledgeBase[Math.floor(Math.random() * knowledgeBase.length)];
    const context = randomDoc.noi_dung;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("API Key không được tìm thấy. Hãy kiểm tra file .env và biến môi trường trên Netlify.");
    }

    const prompt = `Dựa vào câu sau: "${context}". Hãy tạo một câu hỏi trắc nghiệm có 4 lựa chọn. Trả về dưới dạng MỘT ĐỐI TƯỢNG JSON duy nhất, cấu trúc là: {"question": "nội dung câu hỏi", "options": ["lựa chọn 1", "lựa chọn 2", "lựa chọn 3", "lựa chọn 4"], "answer": "nội dung đáp án đúng"}`;

    // === NÂNG CẤP THEO THÔNG TIN BẠN CUNG CẤP: Sử dụng model 'gemini-2.5-flash' ===
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`Lỗi từ API của Google: ${data.error.message}`);
    }

    const aiResponseText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '');
    const quizData = JSON.parse(aiResponseText);

    return { statusCode: 200, body: JSON.stringify(quizData) };

  } catch (error) {
    console.error("LỖI CHI TIẾT TẠI CREATE-QUIZ.JS:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};

