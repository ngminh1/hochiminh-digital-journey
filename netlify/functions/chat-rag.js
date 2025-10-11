const fs = require('fs');
const path = require('path');

// =================================================================
// 1. TỐI ƯU HÓA & KHẮC PHỤC LỖI: Đọc file knowledge.json CHỈ MỘT LẦN 
// =================================================================

// KHẮC PHỤC LỖI ENOENT: 
// Cách an toàn nhất là sử dụng path.join(process.cwd(), 'data', 'knowledge.json');
// Tuy nhiên, Netlify có cách cấu hình đặc biệt. Log cho thấy file nằm trong /var/task/data.
// Ta dùng __dirname để trỏ ngược về gốc gói triển khai.

// Giả sử Netlify đặt file data ở gốc của gói triển khai, bên cạnh thư mục hàm.
const KNOWLEDGE_PATH = path.join(__dirname, '..', 'data', 'knowledge.json');

let knowledgeBase = [];

try {
    const knowledgeData = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
    knowledgeBase = JSON.parse(knowledgeData);
    console.log(`DEBUG: Đã tải ${knowledgeBase.length} mục kiến thức.`);
} catch (error) {
    console.error("LỖI KHỞI TẠO:", error);
    // Hàm sẽ trả về lỗi nội bộ nếu không tìm thấy file.
}

// Hàm tìm kiếm Knowledge đã được tối ưu hóa (Không thay đổi)
function searchKnowledge(question) {
    const keywords = question.toLowerCase().split(' ');
    
    const relevantDocs = knowledgeBase.filter(doc => {
        const content = doc.noi_dung.toLowerCase();
        // Lọc từ khóa có độ dài > 2
        return keywords.some(keyword => content.includes(keyword) && keyword.length > 2);
    });

    if (relevantDocs.length === 0) {
        return null;
    }

    return relevantDocs.map(doc => doc.noi_dung).join('\n\n');
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (knowledgeBase.length === 0) {
         return {
            statusCode: 500,
            body: JSON.stringify({ error: "Lỗi nội bộ: Không thể tải dữ liệu kiến thức. Vui lòng kiểm tra Log." })
        };
    }

    try {
        const { question } = JSON.parse(event.body);
        const context = searchKnowledge(question);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error("API Key không được tìm thấy. Hãy kiểm tra biến môi trường trên Netlify.");
        }

        // === PROMPT & GỌI API GEMINI (Giữ nguyên) ===
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
            body: JSON.stringify({ error: "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau." })
        };
    }
};
