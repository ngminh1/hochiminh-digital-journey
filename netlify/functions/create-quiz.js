const fs = require('fs');
const path = require('path');

// =================================================================
// 1. TỐI ƯU HÓA: Đọc file knowledge.json CHỈ MỘT LẦN khi hàm khởi tạo
// =================================================================

// Đường dẫn đơn giản vì file knowledge.json đã được di chuyển vào cùng thư mục /netlify/functions/
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge.json');

let knowledgeBase = [];

try {
    const knowledgeData = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
    knowledgeBase = JSON.parse(knowledgeData);
    console.log(`DEBUG: Đã tải ${knowledgeBase.length} mục kiến thức cho Quiz.`);
} catch (error) {
    console.error("LỖI KHỞI TẠO QUIZ:", error);
    // Để trống knowledgeBase, hàm sẽ xử lý lỗi này sau.
}

// Hàm chọn ngẫu nhiên các tài liệu để tạo câu hỏi
function selectRandomDocs(docs, count = 5) {
    const shuffled = [...docs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Kiểm tra nếu knowledgeBase bị lỗi khi khởi tạo
    if (knowledgeBase.length === 0) {
         return {
            statusCode: 500,
            body: JSON.stringify({ error: "Lỗi nội bộ: Không thể tải dữ liệu kiến thức cho Quiz. (Kiểm tra đường dẫn file)" })
        };
    }
    
    try {
        // Chọn ngẫu nhiên 5 tài liệu để làm cơ sở cho prompt
        const selectedDocs = selectRandomDocs(knowledgeBase, 5);
        const context = selectedDocs.map(doc => doc.noi_dung).join('\n---\n');

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error("API Key (GEMINI_API_KEY) không được tìm thấy. Hãy kiểm tra biến môi trường trên Netlify.");
        }

        // === PROMPT TẠO QUIZ CHO GEMINI ===
        const prompt = `Dựa trên các tài liệu tham khảo dưới đây, hãy tạo một câu hỏi trắc nghiệm (Multiple Choice Question) về tư tưởng Hồ Chí Minh.
        
Định dạng phải là JSON hợp lệ. Bắt buộc phải có 1 câu hỏi, 4 lựa chọn (A, B, C, D) và đáp án (Answer).
        
Các tài liệu tham khảo:
---
${context}
---

Định dạng JSON BẮT BUỘC (không thêm bất kỳ văn bản nào khác):
{
  "question": "Câu hỏi của bạn?",
  "options": {
    "A": "Lựa chọn A",
    "B": "Lựa chọn B",
    "C": "Lựa chọn C",
    "D": "Lựa chọn D"
  },
  "answer": "Chữ cái (A, B, C, hoặc D) là đáp án đúng"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`Lỗi từ API của Google: ${data.error.message}`);
        }

        if (!data.candidates || data.candidates.length === 0) {
             throw new Error("API không trả về kết quả. Nội dung có thể bị chặn.");
        }

        // === KHẮC PHỤC LỖI PARSING JSON ===
        let aiResponse = data.candidates[0].content.parts[0].text;
        
        // 1. Loại bỏ tất cả dấu ngoặc ngược (```json)
        aiResponse = aiResponse.replace(/```json|```/g, '').trim(); 
        
        // 2. Loại bỏ các ký tự xuống dòng thừa (để JSON nằm trên một dòng duy nhất, đảm bảo parsing)
        aiResponse = aiResponse.replace(/(\r\n|\n|\r)/gm, "");
        
        const quizObject = JSON.parse(aiResponse);

        return { statusCode: 200, body: JSON.stringify({ quiz: quizObject }) };

    } catch (error) {
        console.error("LỖI CHI TIẾT TẠI CREATE-QUIZ.JS:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Lỗi tạo câu hỏi, vui lòng thử lại." })
        };
    }
};