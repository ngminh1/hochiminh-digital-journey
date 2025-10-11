// --- Biến chính ---
const timeline = document.querySelector(".timeline-container");
const items = document.querySelectorAll(".timeline-item");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

let currentIndex = 0;

// --- Hàm cập nhật vị trí ---
function updateTimeline() {
  timeline.style.transform = `translateX(-${currentIndex * 100}vw)`;
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentIndex);
  });
}

// --- Sự kiện nút bấm ---
nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % items.length;
  updateTimeline();
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  updateTimeline();
});

// --- Cuộn ngang bằng chuột ---
window.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) {
    currentIndex = Math.min(currentIndex + 1, items.length - 1);
  } else {
    currentIndex = Math.max(currentIndex - 1, 0);
  }
  updateTimeline();
});

// --- Tự động kích hoạt mốc đầu ---
updateTimeline();
