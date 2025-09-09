function openModal() {
  document.getElementById("refundModal").style.display = "block";
}

function closeModal() {
  document.getElementById("refundModal").style.display = "none";
}

document.getElementById("refundForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const paymentId = document.getElementById("paymentId").value;
  const amount = document.getElementById("amount").value;
  const description = document.getElementById("description").value;

  alert(
    `Refund Requested:\nPayment ID: ${paymentId}\nAmount: ${amount}\nDescription: ${description}`
  );

  this.reset();

  closeModal();
});
