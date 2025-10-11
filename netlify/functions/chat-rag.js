const fs = require('fs');
const path = require('path');

// =================================================================
// 1. TỐI ƯU HÓA: Đọc file knowledge.json CHỈ MỘT LẦN khi hàm khởi tạo
// =================================================================

// LƯU Ý: Đây là cách an toàn nhất để tìm file data từ vị trí của function.
// __dirname là /netlify/functions/chat-rag.js. Ta đi ngược về thư mục gốc của dự án.
const KNOWLEDGE_PATH = path.join(__dirname, '..', '..', 'data', 'knowledge.json');

let knowledgeBase = [];

try {
    const knowledgeData = fs.readFileSync(KNOWLEDGE_PATH, 'utf8');
    knowledgeBase = JSON.parse(knowledgeData);
    console.log(`DEBUG: Đã tải ${knowledgeBase.length} mục kiến thức.`);
} catch (error) {
    console.error("LỖI KHỞI TẠO:", error);
    // Hàm sẽ trả về lỗi nội bộ nếu không tìm thấy file.
}

// Hàm tìm kiếm Knowledge đã được tối ưu hóa
function searchKnowledge(question) {
    // 2. KHẮC PHỤC LỖI: Sử dụng knowledgeBase đã được tải sẵn
    const keywords = question.toLowerCase().split(' ');
    
    // Lọc các từ khóa có độ dài > 2 để tăng hiệu quả tìm kiếm
    const relevantDocs = knowledgeBase.filter(doc => {
        const content = doc.noi_dung.toLowerCase();
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

    // Kiểm tra nếu knowledgeBase bị lỗi khi khởi tạo (do không tìm thấy file)
    if (knowledgeBase.length === 0) {
         return {
            statusCode: 500,
            body: JSON.stringify({ error: "Lỗi nội bộ: Không thể tải dữ liệu kiến thức từ server. (Kiểm tra đường dẫn file data)" })
        };
    }

    try {
        const { question } = JSON.parse(event.body);
        const context = searchKnowledge(question);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            throw new Error("API Key không được tìm thấy. Hãy kiểm tra biến môi trường trên Netlify.");
        }

        // === PROMPT ĐÃ ĐƯỢC TỐI ƯU ===
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
