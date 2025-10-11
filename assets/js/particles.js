const canvas = document.getElementById("portraitCanvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const img = new Image();
img.src = "assets/img/hochiminh_portrait.jpg";

let particles = [];
const density = 2; // Giữ ở 2 để cân bằng chi tiết và hiệu suất

class Particle {
  constructor(x, y, color, isAmbient) {
    this.baseX = x;
    this.baseY = y;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.color = color;
    this.size = Math.random() * 1 + 1; // Giảm kích thước xuống 1-2
    this.isAmbient = isAmbient;
    this.isSettled = false;

    if (this.isAmbient) {
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    if (this.isSettled && !this.isAmbient) {
      this.draw();
      return;
    }

    const convergenceSpeed = 0.15;
    let dx = this.baseX - this.x;
    let dy = this.baseY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      this.x += dx * convergenceSpeed;
      this.y += dy * convergenceSpeed;
    } else {
      if (!this.isSettled) {
        this.isSettled = true;
        this.x = this.baseX;
        this.y = this.baseY;
      }

      if (this.isAmbient) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
    }
    this.draw();
  }
}

img.onload = () => {
  particles = [];
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  
  // Tăng kích thước ảnh lên 2x để có nhiều chi tiết hơn
  const scaleFactor = 2;
  tempCanvas.width = img.width * scaleFactor;
  tempCanvas.height = img.height * scaleFactor;
  
  // Sử dụng image smoothing chất lượng cao
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
  
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const canvasDrawAreaWidth = canvas.width * (0.6 / 0.7);
  const imgAspectRatio = tempCanvas.height / tempCanvas.width;
  let drawWidth = canvasDrawAreaWidth * 0.8;
  let drawHeight = drawWidth * imgAspectRatio;
  if (drawHeight > canvas.height * 0.9) {
    drawHeight = canvas.height * 0.9;
    drawWidth = drawHeight / imgAspectRatio;
  }
  const offsetX = (canvasDrawAreaWidth - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;
  const scaleX = drawWidth / tempCanvas.width;
  const scaleY = drawHeight / tempCanvas.height;
  
  for (let y = 0; y < tempCanvas.height; y += density) {
    for (let x = 0; x < tempCanvas.width; x += density) {
      const index = (y * tempCanvas.width + x) * 4;
      const alpha = imageData.data[index + 3];
      
      if (alpha > 128) {
        const destX = x * scaleX + offsetX;
        const destY = y * scaleY + offsetY;
        
        // Lấy màu gốc
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const a = imageData.data[index + 3] / 255;
        
        // Tính độ sáng (0 = đen, 1 = trắng)
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        // Màu vàng nhẹ nhàng giống chữ (rgb(248, 210, 74))
        // Vùng tối -> vàng đậm, vùng sáng -> vàng nhạt
        const newR = Math.floor(150 + brightness * 105); // 150-255
        const newG = Math.floor(120 + brightness * 135); // 120-255  
        const newB = Math.floor(20 + brightness * 80);   // 20-100
        
        const color = `rgba(${newR}, ${newG}, ${newB}, ${a})`;

        const isAmbient = Math.random() < 0.02;
        particles.push(new Particle(destX, destY, color, isAmbient));
      }
    }
  }
  cancelAnimationFrame(animationFrameId);
  animate();
};

let animationFrameId;
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.update();
  }
  animationFrameId = requestAnimationFrame(animate);
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (img.complete) {
             img.onload();
        }
    }, 250);
});