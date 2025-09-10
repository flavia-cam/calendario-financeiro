"use strict";

/* elementos */
const calendar = document.getElementById("calendar");
const modal = document.getElementById("transactionModal");
const closeModal = document.getElementById("closeModal");
const selectedDateText = document.getElementById("selectedDate");
const transactionForm = document.getElementById("transactionForm");
const transactionsList = document.getElementById("transactionsList");
const monthYearEl = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

let currentDate = new Date();
let transactions = {}; // { '2025-09-10': [ {description, amount, method, photoUrl}, ... ] }
const weekStartMonday = true;
const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

/* -------- Persistência (localStorage) -------- */
function saveTransactionsToStorage() {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  } catch (e) {
    console.error("Erro ao salvar no localStorage:", e);
  }
}

function loadTransactionsFromStorage() {
  try {
    const raw = localStorage.getItem("transactions");
    transactions = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Erro ao carregar localStorage:", e);
    transactions = {};
  }
}

/* util: zero padding */
function pad(n) { return String(n).padStart(2,'0'); }

/* -------- Cria o calendário -------- */
function createCalendar(date) {
  try {
    calendar.innerHTML = "";
    const year = date.getFullYear();
    const month = date.getMonth();

    // topo mês/ano
    monthYearEl.innerText = `${meses[month]} de ${year}`;

    // cabeçalho dias da semana
    const weekdayNames = weekStartMonday
      ? ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
      : ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

    weekdayNames.forEach(name => {
      const d = document.createElement("div");
      d.classList.add("weekday");
      d.innerText = name;
      calendar.appendChild(d);
    });

    // primeiro dia e dias no mês
    let firstDay = new Date(year, month, 1).getDay(); // 0..6 (domingo..sab)
    if (weekStartMonday) firstDay = (firstDay + 6) % 7; // ajustar para segunda

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // placeholders
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("empty");
      calendar.appendChild(empty);
    }

    // dias
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("day");
      dayDiv.style.position = "relative";

      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`; // YYYY-MM-DD
      dayDiv.dataset.date = dateKey;
      dayDiv.innerHTML = `<div class="day-number">${day}</div>`;

      // indicadores
      if (transactions[dateKey] && transactions[dateKey].length) {
        const types = transactions[dateKey].map(t => t.method);
        const uniqueTypes = [...new Set(types)];
        uniqueTypes.forEach(type => {
          const indicator = document.createElement("div");
          indicator.classList.add("transaction-indicator", type);
          indicator.title = `Transação(s): ${type}`;
          dayDiv.appendChild(indicator);
        });
      }

      // destaque do dia atual
      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayDiv.classList.add("today");
      }

      dayDiv.addEventListener("click", () => openModal(dateKey));
      calendar.appendChild(dayDiv);
    }
  } catch (err) {
    console.error("createCalendar error:", err);
  }
}

/* -------- Navegação de meses -------- */
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  createCalendar(currentDate);
}
function goToToday() {
  currentDate = new Date();
  createCalendar(currentDate);
}
prevMonthBtn && prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn && nextMonthBtn.addEventListener('click', () => changeMonth(1));
todayBtn && todayBtn.addEventListener('click', goToToday);

/* -------- Modal / transações -------- */
function openModal(dateKey) {
  selectedDateText.textContent = `Data: ${dateKey}`;
  modal.dataset.selectedDate = dateKey;
  modal.style.display = "block";
  showTransactions(dateKey);
}

function showTransactions(dateKey) {
  try {
    transactionsList.innerHTML = "";

    const list = transactions[dateKey];
    if (!list || list.length === 0) {
      transactionsList.innerHTML = "<li>Nenhuma transação neste dia.</li>";
      return;
    }

    list.forEach((t, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="transaction-header">
          <strong>${escapeHtml(t.description)}</strong>
          <button class="transactions-delete" data-index="${index}" data-date="${dateKey}">✖</button>
        </div>
        <div>Valor: R$${Number(t.amount).toFixed(2)}</div>
        <div>Forma: ${escapeHtml(t.method.toUpperCase())}</div>
        ${t.photoUrl ? `<div><img src="${t.photoUrl}" class="transaction-photo" alt="Foto"></div>` : ''}
      `;

      const delBtn = li.querySelector(".transactions-delete");
      if (delBtn) {
        delBtn.addEventListener("click", () => deleteTransaction(dateKey, index));
      }

      transactionsList.appendChild(li);
    });
  } catch (err) {
    console.error("showTransactions error:", err);
  }
}

function deleteTransaction(dateKey, index) {
  try {
    if (!transactions[dateKey]) return;
    if (index < 0 || index >= transactions[dateKey].length) return;
    transactions[dateKey].splice(index, 1);
    if (transactions[dateKey].length === 0) delete transactions[dateKey];
    saveTransactionsToStorage();
    showTransactions(dateKey);
    createCalendar(currentDate);
  } catch (err) {
    console.error("deleteTransaction error:", err);
  }
}

/* fechar modal */
closeModal && (closeModal.onclick = () => { modal.style.display = "none"; });
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

/* -------- Formulário: adicionar transação -------- */
transactionForm && transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const method = document.getElementById("paymentMethod").value;
  const photoInput = document.getElementById("photo");
  const dateKey = modal.dataset.selectedDate;

  if (!dateKey) {
    console.error("Nenhuma data selecionada ao submeter transação.");
    return;
  }

  function pushTransaction(photoUrl) {
    const transaction = {
      description,
      amount,
      method,
      photoUrl: photoUrl || null
    };

    if (!transactions[dateKey]) transactions[dateKey] = [];
    transactions[dateKey].push(transaction);

    saveTransactionsToStorage();
    transactionForm.reset();
    modal.style.display = "none";
    createCalendar(currentDate);
    console.log("Transação salva em", dateKey, transaction);
  }

  if (photoInput && photoInput.files && photoInput.files.length > 0) {
    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = function (ev) {
      pushTransaction(ev.target.result);
    };
    reader.onerror = function (err) {
      console.error("Erro ao ler arquivo:", err);
      pushTransaction(null);
    };
    reader.readAsDataURL(file);
  } else {
    pushTransaction(null);
  }
});

/* -------- Util -------- */
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, function (m) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]);
  });
}

/* -------- Inicialização -------- */
loadTransactionsFromStorage();
createCalendar(currentDate);
console.log("App inicializado. Data atual:", currentDate.toISOString().slice(0,10));
