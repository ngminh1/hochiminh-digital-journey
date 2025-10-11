const fs = require('fs');
const path = require('path');

// Hàm đọc và tìm kiếm trong file knowledge.json
function searchKnowledge(question) {
  const knowledgePath = path.resolve(__dirname, '../../data/knowledge.json');
  const knowledgeBase = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
  const keywords = question.toLowerCase().split(' ');
  const relevantDocs = knowledgeBase.filter(doc => {
    const content = doc.noi_dung.toLowerCase();
    return keywords.some(keyword => content.includes(keyword) && keyword.length > 2);
  });
  return relevantDocs.map(doc => doc.noi_dung).join('\n\n');
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { question } = JSON.parse(event.body);
    const context = searchKnowledge(question);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("API Key không được tìm thấy. Hãy kiểm tra file .env và biến môi trường trên Netlify.");
    }

    // === THAY ĐỔI PROMPT ĐỂ AI TRẢ LỜI TỰ NHIÊN HƠN ===
    const prompt = `Bạn là một chuyên gia AI về tư tưởng Hồ Chí Minh. Hãy trả lời câu hỏi của người dùng một cách trực tiếp, tự nhiên và súc tích.
    
Kết hợp kiến thức của bạn với thông tin tham khảo dưới đây (nếu có) để trả lời. Đừng đề cập đến "ngữ cảnh" hay "tài liệu tham khảo" trong câu trả lời của bạn.

Thông tin tham khảo:
---
${context || "Không có thông tin."}
---

Câu hỏi: ${question}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(`Lỗi từ API của Google: ${data.error.message}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("API không trả về kết quả hợp lệ. Có thể do nội dung bị chặn.");
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    return { statusCode: 200, body: JSON.stringify({ reply: aiResponse.trim() }) };

  } catch (error) {
    console.error("LỖI CHI TIẾT TẠI CHAT-RAG.JS:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};

