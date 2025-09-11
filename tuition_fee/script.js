let fees = [];
let editIndex = null;

const modal = document.getElementById("modal");
const typeFee = document.getElementById("typeFee");
const amount = document.getElementById("amount");
const tbody = document.querySelector("#feeTable tbody");
const modalTitle = document.getElementById("modalTitle");

function openModal(edit = false, index = null) {
  modal.style.display = "flex";
  if (edit) {
    modalTitle.textContent = "Edit Tuition Fee";
    typeFee.value = fees[index].type;
    amount.value = fees[index].amount;
    editIndex = index;
  } else {
    modalTitle.textContent = "Add Tuition Fee";
    typeFee.value = "";
    amount.value = "";
    editIndex = null;
  }
}

function closeModal() {
  modal.style.display = "none";
}

function saveFee() {
  const newFee = {
    type: typeFee.value,
    amount: parseFloat(amount.value).toFixed(2),
  };

  if (editIndex !== null) {
    fees[editIndex] = newFee;
  } else {
    fees.push(newFee);
  }

  renderTable();
  closeModal();
}

function deleteFee(index) {
  fees.splice(index, 1);
  renderTable();
}

function renderTable() {
  tbody.innerHTML = "";
  fees.forEach((fee, index) => {
    const row = `
          <tr>
            <td>${fee.type}</td>
            <td>₱${fee.amount}</td>
            <td>
              <button class="btn btn-edit" onclick="openModal(true, ${index})">Edit</button>
              <button class="btn btn-delete" onclick="deleteFee(${index})">Delete</button>
            </td>
          </tr>
        `;
    tbody.innerHTML += row;
  });
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};