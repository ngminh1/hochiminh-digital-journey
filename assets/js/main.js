// Load header & footer
async function loadComponent(id, file) {
  const res = await fetch(file);
  const text = await res.text();
  document.getElementById(id).innerHTML = text;
}

window.onload = () => {
  loadComponent("menu-container", "components/header.html");
  loadComponent("footer-container", "components/footer.html");
};

// Áp dụng chủ đề sáng cho các trang không phải index
if (!window.location.pathname.endsWith("index.html") && !window.location.pathname.endsWith("/")) {
  document.body.classList.add("light-theme");
}
// Hiện mốc lịch sử khi cuộn đến
const timelineItems = document.querySelectorAll(".timeline-item");
function showVisibleItems() {
  timelineItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      item.classList.add("visible");
    }
  });
}
window.addEventListener("scroll", showVisibleItems);
showVisibleItems();

// Hiệu ứng reveal khi cuộn
const reveals = document.querySelectorAll('.reveal');
function revealOnScroll() {
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const revealTop = reveals[i].getBoundingClientRect().top;
    const revealPoint = 100;
    if (revealTop < windowHeight - revealPoint) {
      reveals[i].classList.add('active');
    }
  }
}
window.addEventListener('scroll', revealOnScroll);
