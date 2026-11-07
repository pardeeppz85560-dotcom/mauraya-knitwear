
/* =====================================
   MAURAYA KNITWEAR - WEBSITE SETTINGS
===================================== */

// Apps Script deploy karne ke baad yahan Web App URL paste karna.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAvomlLJ3MVLkiWC8bK3KBKB4tSVfwavSH5NOg24-Oll-GD4Kgy9qJA7ugIUJUY3OTjw/exec";

const products = [
  {id:1,name:"Classic V-Neck Sweater",category:"boys",price:699,image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700"},
  {id:2,name:"Premium Round Neck Sweater",category:"boys",price:799,image:"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=700"},
  {id:3,name:"Girls Winter Knit Sweater",category:"girls",price:749,image:"https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=700"},
  {id:4,name:"Classic School Sweater",category:"uniform",price:650,image:"https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=700"},
  {id:5,name:"School V-Neck Uniform",category:"uniform",price:680,image:"https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=700"},
  {id:6,name:"College Winter Sweater",category:"college",price:899,image:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700"},
  {id:7,name:"Winter Everyday Pullover",category:"winter",price:850,image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700"},
  {id:8,name:"Warm Knitted Cardigan",category:"girls",price:899,image:"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=700"},
  {id:9,name:"Premium Winter Knitwear",category:"winter",price:999,image:"https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=700"},
  {id:10,name:"School Full Sleeve Sweater",category:"uniform",price:720,image:"https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=700"},
  {id:11,name:"Boys Casual Pullover",category:"boys",price:749,image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700"},
  {id:12,name:"Girls Classic Knitwear",category:"girls",price:799,image:"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=700"}
];

let cart = JSON.parse(localStorage.getItem("mk_cart") || "[]");
let history = JSON.parse(localStorage.getItem("mk_history") || "[]");
let localReviews = JSON.parse(localStorage.getItem("mk_reviews") || "[]");

const $ = id => document.getElementById(id);

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function saveCart() {
  localStorage.setItem("mk_cart", JSON.stringify(cart));
  updateCart();
}

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

/* =====================================
   PRODUCT CATALOGUE
===================================== */

function renderProducts() {
  const search = ($("searchInput")?.value || "").toLowerCase();
  const category = $("categoryFilter")?.value || "all";
  const sort = $("sortFilter")?.value || "default";

  let list = products.filter(p =>
    (category === "all" || p.category === category) &&
    p.name.toLowerCase().includes(search)
  );

  if (sort === "low") list.sort((a,b) => a.price-b.price);
  if (sort === "high") list.sort((a,b) => b.price-a.price);

  $("productGrid").innerHTML = list.length ? list.map(p => `
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <small>${p.category} collection</small>
        <h3>${p.name}</h3>
        <p>Winter sweater sample. Confirm sizes, colours and availability.</p>
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}">+ Add</button>
        </div>
      </div>
    </article>
  `).join("") : `<div class="empty-state">No sweaters found. Try another search.</div>`;

  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(Number(btn.dataset.add)));
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity++;
  else cart.push({...product, quantity:1});

  saveCart();
  showToast(product.name + " added to cart");
}

function updateCart() {
  const count = cart.reduce((sum,item) => sum + item.quantity, 0);
  const total = cart.reduce((sum,item) => sum + item.price * item.quantity, 0);

  $("cartCount").textContent = count;
  $("cartItems").textContent = count;
  $("cartTotal").textContent = money(total);
}

/* =====================================
   ORDER HISTORY
===================================== */

function renderHistory() {
  const container = $("historyList");

  if (!history.length) {
    container.innerHTML = `<div class="empty-state">No orders submitted from this browser yet.</div>`;
    return;
  }

  container.innerHTML = history.map((item,index) => `
    <div class="history-item">
      <div>
        <strong>Order ${item.id}</strong>
        <p>${item.date} · ${item.day} · ${item.time}</p>
        <p>${item.name} · ${item.phone} · ${item.items} item(s)</p>
        <p>Estimated total: ${money(item.total)} · ${item.status}</p>
      </div>
      <button class="delete-btn" data-delete="${index}">Delete</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      history.splice(Number(btn.dataset.delete),1);
      localStorage.setItem("mk_history",JSON.stringify(history));
      renderHistory();
      showToast("History entry deleted from this browser");
    });
  });
}

/* =====================================
   GOOGLE SHEETS SUBMISSION
===================================== */

function sendToGoogleSheets(data) {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR")) {
    showToast("Google Sheets URL not added yet. Please configure Apps Script.");
    return;
  }

  const body = new URLSearchParams(data);

  // no-cors response ko browser read nahi kar sakta.
  // Google Sheet mein jaakar submission verify karna zaroori hai.
  fetch(SCRIPT_URL, {
    method:"POST",
    mode:"no-cors",
    body
  }).catch(error => {
    console.error("Submission error:",error);
  });
}

/* =====================================
   ORDER FORM
===================================== */

$("orderForm").addEventListener("submit", function(event) {
  event.preventDefault();

  if (!cart.length) {
    showToast("Please add at least one sweater to your cart.");
    return;
  }

  const form = new FormData(this);
  const orderId = "MK" + Date.now().toString().slice(-8);
  const total = cart.reduce((sum,item) => sum + item.price*item.quantity,0);
  const itemsText = cart.map(item =>
    `${item.name} x ${item.quantity}`
  ).join(", ");

  const now = new Date();

  const order = {
    id:orderId,
    name:form.get("name"),
    phone:form.get("phone"),
    date:now.toLocaleDateString("en-IN"),
    day:now.toLocaleDateString("en-IN",{weekday:"long"}),
    time:now.toLocaleTimeString("en-IN"),
    items:cart.reduce((sum,item) => sum+item.quantity,0),
    total,
    status:"Enquiry submitted"
  };

  history.unshift(order);
  localStorage.setItem("mk_history",JSON.stringify(history));

  sendToGoogleSheets({
    type:"order",
    orderId,
    name:form.get("name"),
    phone:form.get("phone"),
    email:form.get("email"),
    city:form.get("city"),
    orderType:form.get("orderType"),
    product:itemsText,
    quantity:order.items,
    total,
    message:form.get("message") || ""
  });

  const whatsappText = encodeURIComponent(
    `Hello Mauraya Knitwear! My order enquiry:\nOrder ID: ${orderId}\nName: ${order.name}\nPhone: ${order.phone}\nItems: ${itemsText}\nEstimated Total: ${money(total)}`
  );

  // WhatsApp enquiry opens with the order details.
  window.open(`https://wa.me/918556093793?text=${whatsappText}`,"_blank");

  cart = [];
  saveCart();
  this.reset();
  renderHistory();
  showToast("Order enquiry prepared. Please send it on WhatsApp.");
});

/* =====================================
   CUSTOMER REVIEWS
===================================== */

function renderReviews() {
  const container = $("reviewList");

  if (!localReviews.length) {
    container.innerHTML = `<div class="empty-state">No local reviews yet. Be the first to share feedback.</div>`;
  } else {
    container.innerHTML = localReviews.map(review => `
      <article class="review-card">
        <strong>${escapeHTML(review.customer)}</strong>
        <div class="stars">${"★".repeat(review.rating)}${"☆".repeat(5-review.rating)}</div>
        <p>${escapeHTML(review.message)}</p>
      </article>
    `).join("");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}

$("reviewForm").addEventListener("submit",function(event) {
  event.preventDefault();
  const form = new FormData(this);

  const review = {
    customer:form.get("customer"),
    rating:Number(form.get("rating")),
    message:form.get("message")
  };

  localReviews.unshift(review);
  localStorage.setItem("mk_reviews",JSON.stringify(localReviews));

  sendToGoogleSheets({
    type:"review",
    name:review.customer,
    rating:review.rating,
    message:review.message
  });

  renderReviews();
  this.reset();
  showToast("Thank you for your feedback!");
});

/* =====================================
   COMPANY-WIDE LIVE STATISTICS
===================================== */

function loadCompanyStats() {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR")) return;

  const callbackName = "mkStatsCallback";
  window[callbackName] = function(data) {
    if (!data || !data.success) return;
    $("ordersStat").textContent = data.orders;
    $("happyStat").textContent = data.happyCustomers;
    $("reviewsStat").textContent = data.reviews;
    delete window[callbackName];
  };

  const script = document.createElement("script");
  script.src = SCRIPT_URL + "?callback=" + callbackName + "&t=" + Date.now();
  script.onerror = () => console.warn("Company statistics could not be loaded.");
  document.body.appendChild(script);
}

/* =====================================
   INTERACTIVE SHOWCASE
===================================== */

const showcaseImages = [
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900",
  "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=900",
  "https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=900",
  "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=900"
];

let currentView = 0;

function changeView(direction) {
  currentView = (currentView + direction + showcaseImages.length) % showcaseImages.length;
  $("spinImage").src = showcaseImages[currentView];
}

$("prevView").addEventListener("click",() => changeView(-1));
$("nextView").addEventListener("click",() => changeView(1));

/* =====================================
   VIDEO LINKS
===================================== */

const videoTopics = [
  "Winter sweater manufacturing",
  "Knitting machine process",
  "Wool sweater production",
  "School uniform sweater ideas",
  "Winter sweater design ideas",
  "Knitting factory process",
  "Sweater quality checking",
  "Winter fashion collection",
  "Sweater packing process",
  "Knitting yarn to sweater",
  "Machine knitted sweaters",
  "Winter clothing care"
];

$("videoGrid").innerHTML = videoTopics.map(topic => `
  <article class="video-card">
    <span>▶️</span>
    <h3>${topic}</h3>
    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}" target="_blank">Watch videos on YouTube ↗</a>
  </article>
`).join("");

/* =====================================
   SIDEBAR + THEME
===================================== */

$("menuBtn").addEventListener("click",() => $("sidebar").classList.add("open"));
$("closeMenu").addEventListener("click",() => $("sidebar").classList.remove("open"));

document.querySelectorAll(".side-nav a").forEach(link => {
  link.addEventListener("click",() => {
    document.querySelectorAll(".side-nav a").forEach(a => a.classList.remove("active"));
    link.classList.add("active");
    $("sidebar").classList.remove("open");
  });
});

const savedTheme = localStorage.getItem("mk_theme");
if (savedTheme === "dark") document.body.classList.add("dark");

$("themeToggle").addEventListener("click",() => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "mk_theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

/* =====================================
   CLEAR HISTORY + INITIALIZE
===================================== */

$("clearHistory").addEventListener("click",() => {
  if (!history.length) return showToast("History is already empty.");
  if (!confirm("Delete all order history from this browser?")) return;

  history = [];
  localStorage.removeItem("mk_history");
  renderHistory();
  showToast("Browser order history cleared");
});

$("searchInput").addEventListener("input",renderProducts);
$("categoryFilter").addEventListener("change",renderProducts);
$("sortFilter").addEventListener("change",renderProducts);

$("year").textContent = new Date().getFullYear();

renderProducts();
updateCart();
renderHistory();
renderReviews();
loadCompanyStats();
