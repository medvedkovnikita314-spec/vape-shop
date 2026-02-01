/* ===== ПОЛЬЗОВАТЕЛИ ===== */
const users = [
  { login: "admin", pass: "admin", role: "admin" },
  { login: "seller", pass: "1234", role: "seller" }
];

/* ===== ХРАНИЛИЩЕ ===== */
let products = JSON.parse(localStorage.getItem("products")) || [];
let sales = JSON.parse(localStorage.getItem("sales")) || [];

/* ===== ВХОД ===== */
function login() {
  const l = document.getElementById("login").value.trim();
  const p = document.getElementById("password").value.trim();

  const user = users.find(u => u.login === l && u.pass === p);
  if (!user) {
    alert("Неверный логин или пароль");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("role").innerText = "Роль: " + user.role;

  render();
  renderSales();
}

/* ===== ВЫХОД ===== */
function logout() {
  localStorage.removeItem("user");
  location.reload();
}

/* ===== ДОБАВЛЕНИЕ ТОВАРА ===== */
function addProduct() {
  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value.trim();
  const price = +document.getElementById("price").value;
  const cost = +document.getElementById("cost").value;
  const stock = +document.getElementById("stock").value;

  if (!name || !category || stock <= 0) {
    alert("Заполните все поля корректно");
    return;
  }

  const existing = products.find(
    p => p.name === name && p.category === category
  );

  if (existing) {
    existing.stock += stock;
  } else {
    products.push({ name, category, price, cost, stock });
  }

  save();
  render();

  document.getElementById("name").value = "";
  document.getElementById("category").value = "";
  document.getElementById("price").value = "";
  document.getElementById("cost").value = "";
  document.getElementById("stock").value = "";
}

/* ===== ПРОДАЖА ===== */
function sell(i) {
  if (products[i].stock <= 0) {
    alert("Нет товара");
    return;
  }

  products[i].stock--;

  const user = JSON.parse(localStorage.getItem("user"));
  const profit = products[i].price - products[i].cost;

  sales.push({
    name: products[i].name,
    category: products[i].category,
    seller: user.login,
    price: products[i].price,
    profit: profit,
    date: new Date().toISOString()
  });

  localStorage.setItem("sales", JSON.stringify(sales));
  save();
  render();
  renderSales();
}

/* ===== СОХРАНЕНИЕ ===== */
function save() {
  localStorage.setItem("products", JSON.stringify(products));
}

/* ===== ОТОБРАЖЕНИЕ ТОВАРОВ ===== */
function render() {
  const div = document.getElementById("products");
  div.innerHTML = "";

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const category = document.getElementById("filterCategory")?.value || "";
  const onlyStock = document.getElementById("onlyInStock")?.checked;

  let filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (category && p.category !== category) return false;
    if (onlyStock && p.stock <= 0) return false;
    return true;
  });

  filtered.forEach((p, i) => {
    div.innerHTML += `
      <div style="border:1px solid #ccc; padding:5px; margin:5px">
        <b>${p.name}</b><br>
        Категория: ${p.category}<br>
        Цена: ${p.price}<br>
        Остаток: ${p.stock}<br>
        <button onclick="sell(${products.indexOf(p)})">Продать</button>
      </div>
    `;
  });

  updateCategoryFilter();
}

/* ===== ИСТОРИЯ ПРОДАЖ ===== */
function renderSales() {
  const div = document.getElementById("sales");
  div.innerHTML = "";

  const user = JSON.parse(localStorage.getItem("user"));
  let total = 0;

  sales.forEach(s => {
    if (user.role === "admin") total += s.profit;

    div.innerHTML += `
      <div style="border:1px solid #ccc; padding:5px; margin:5px">
        <b>${s.name}</b> (${s.category})<br>
        Продавец: ${s.seller}<br>
        Дата: ${new Date(s.date).toLocaleString()}
        ${user.role === "admin" ? `<br><b>Прибыль: ${s.profit}</b>` : ""}
      </div>
    `;
  });

  document.getElementById("profit").innerText =
    user.role === "admin" ? "💰 Общая прибыль: " + total : "";
}

/* ===== ОТЧЁТЫ ===== */
function report(period) {
  const user = JSON.parse(localStorage.getItem("user"));
  const now = new Date();
  let from = new Date();

  if (period === "day") from.setHours(0,0,0,0);
  if (period === "week") from.setDate(now.getDate() - 7);
  if (period === "month") from.setMonth(now.getMonth() - 1);
  if (period === "year") from.setFullYear(now.getFullYear() - 1);

  let count = 0;
  let total = 0;
  let profit = 0;

  sales.forEach(s => {
    const d = new Date(s.date);
    if (d >= from) {
      count++;
      total += s.price;
      profit += s.profit;
    }
  });

  let html = `
    <div style="border:1px solid #ccc; padding:10px">
      <b>Продаж:</b> ${count}<br>
      <b>На сумму:</b> ${total}
  `;

  if (user.role === "admin") {
    html += `<br><b>💰 Прибыль:</b> ${profit}`;
  }

  html += `</div>`;

  document.getElementById("reportResult").innerHTML = html;
}

/* ===== ОЧИСТКА БАЗЫ ===== */
function clearBase() {
  if (!confirm("Очистить ВСЮ базу?")) return;
  localStorage.removeItem("products");
  localStorage.removeItem("sales");
  products = [];
  sales = [];
  render();
  renderSales();
  document.getElementById("reportResult").innerHTML = "";
}

/* ===== АВТОВХОД ===== */
const savedUser = JSON.parse(localStorage.getItem("user"));
if (savedUser) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("role").innerText = "Роль: " + savedUser.role;
  render();
  renderSales();
}

/* ===== ФИЛЬТРЫ ===== */
function applyFilters() {
  render();
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("onlyInStock").checked = false;
  render();
}

function updateCategoryFilter() {
  const select = document.getElementById("filterCategory");
  if (!select) return;

  const categories = [...new Set(products.map(p => p.category))];

  select.innerHTML = `<option value="">Все категории</option>`;
  categories.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}








