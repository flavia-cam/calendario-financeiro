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
let transactions = {}; // será carregado do localStorage

const weekStartMonday = true;
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/* -------- Persistência -------- */
function saveTransactionsToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactionsFromStorage() {
  const raw = localStorage.getItem('transactions');
  transactions = raw ? JSON.parse(raw) : {};
}

/* -------- Criação do calendário -------- */
function createCalendar(date) {
  calendar.innerHTML = "";

  const year = date.getFullYear();
  const month = date.getMonth();

  monthYearEl.innerText = `${meses[month]} de ${year}`;

  const weekdayNames = weekStartMonday
    ? ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
    : ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  weekdayNames.forEach(name => {
    const d = document.createElement("div");
    d.classList.add("weekday");
    d.innerText = name;
    calendar.appendChild(d);
  });

  let firstDay = new Date(year, month, 1).getDay();
  if (weekStartMonday) firstDay = (firstDay + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("empty");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.style.position = "relative";

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayDiv.dataset.date = dateKey;
    dayDiv.innerHTML = `<div class="day-number">${day}</div>`;

    if (transactions[dateKey]) {
      const types = transactions[dateKey].map(t => t.method);
      const uniqueTypes = [...new Set(types)];
      uniqueTypes.forEach(type => {
        const indicator = document.createElement("div");
        indicator.classList.add("transaction-indicator", type);
        dayDiv.appendChild(indicator);
      });
    }

    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
      dayDiv.classList.add('today');
    }

    dayDiv.addEventListener("click", () => openModal(dateKey));
    calendar.appendChild(dayDiv);
  }
}

/* -------- Navegação -------- */
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  createCalendar(currentDate);
}

function goToToday() {
  currentDate = new Date();
  createCalendar(currentDate);
}

prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));
todayBtn.addEventListener('click', goToToday);

/* -------- Modal -------- */
function openModal(dateKey) {
  selectedDateText.textContent = `Data: ${dateKey}`;
  modal.dataset.selectedDate = dateKey;
  modal.style.display = "block";
  showTransactions(dateKey);
}

function showTransactions(dateKey) {
  transactionsList.innerHTML = "";

  if (transactions[dateKey]) {
    transactions[dateKey].forEach((t, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${escapeHtml(t.description)}</strong><br>
        Valor: R$${Number(t.amount).toFixed(2)}<br>
        Forma: ${escapeHtml(t.method.toUpperCase())}
        ${t.photoUrl ? `<br><img src="${t.photoUrl}" class="transaction-photo">` : ''}
      `;

      const del = document.createElement('button');
      del.textContent = 'Excluir';
      del.classList.add('transactions-delete');
      del.addEventListener('click', () => {
        deleteTransaction(dateKey, index);
      });

      li.appendChild(del);
      transactionsList.appendChild(li);
    });
  } else {
    transactionsList.innerHTML = '<li>Nenhuma transação neste dia.</li>';
  }
}

function deleteTransaction(dateKey, index) {
  if (!transactions[dateKey]) return;
  transactions[dateKey].splice(index, 1);
  if (transactions[dateKey].length === 0) delete transactions[dateKey];
  saveTransactionsToStorage();
  showTransactions(dateKey);
  createCalendar(currentDate);
}

closeModal.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

/* -------- Formulário -------- */
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const method = document.getElementById("paymentMethod").value;
  const photoInput = document.getElementById("photo");
  const dateKey = modal.dataset.selectedDate;

  if (!dateKey) return;

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
  }

  if (photoInput.files.length > 0) {
    const file = photoInput.files[0];
    const reader = new FileReader();
    reader.onload = function (ev) {
      pushTransaction(ev.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    pushTransaction(null);
  }
});

/* -------- Utils -------- */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

/* Inicializa */
loadTransactionsFromStorage();
createCalendar(currentDate);
