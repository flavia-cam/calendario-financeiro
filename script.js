const calendar = document.getElementById("calendar");
const modal = document.getElementById("transactionModal");
const closeModal = document.getElementById("closeModal");
const selectedDateText = document.getElementById("selectedDate");
const transactionForm = document.getElementById("transactionForm");
const transactionsList = document.getElementById("transactionsList");

let currentDate = new Date();
let transactions = {}; // { '2025-08-06': [ {description, amount, method, photoUrl}, ... ] }

function createCalendar(date) {
  calendar.innerHTML = "";
  const year = date.getFullYear();
  const month = date.getMonth();

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  document.getElementById("monthYear").innerText = `${meses[month]} de ${year}`;
  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    const dateKey = `${year}-${month + 1}-${day}`;
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

    dayDiv.addEventListener("click", () => openModal(dateKey));
    calendar.appendChild(dayDiv);
  }
}
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  createCalendar(currentDate);
}



function openModal(dateKey) {
  selectedDateText.textContent = `Data: ${dateKey}`;
  modal.dataset.selectedDate = dateKey;
  modal.style.display = "block";

  showTransactions(dateKey);
}

function showTransactions(dateKey) {
  transactionsList.innerHTML = "";

  if (transactions[dateKey]) {
    transactions[dateKey].forEach((t) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${t.description}</strong><br>
        Valor: R$${t.amount.toFixed(2)}<br>
        Forma: ${t.method.toUpperCase()}
        ${t.photoUrl ? `<br><img src="${t.photoUrl}" class="transaction-photo">` : ''}
      `;
      transactionsList.appendChild(li);
    });
  }
}

closeModal.onclick = () => modal.style.display = "none";

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const method = document.getElementById("paymentMethod").value;
  const photoInput = document.getElementById("photo");
  const dateKey = modal.dataset.selectedDate;

  const reader = new FileReader();
  reader.onload = function () {
    const photoUrl = reader.result;

    const transaction = {
      description,
      amount,
      method,
      photoUrl: photoInput.files.length > 0 ? photoUrl : null
    };

    if (!transactions[dateKey]) transactions[dateKey] = [];
    transactions[dateKey].push(transaction);

    transactionForm.reset();
    modal.style.display = "none";
    createCalendar(currentDate);
  };

  if (photoInput.files.length > 0) {
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    reader.onload(); // call directly if no file
  }
});

createCalendar(currentDate);
