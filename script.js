let bills = JSON.parse(localStorage.getItem('bills')) || [];
let payFrequency = localStorage.getItem('payFrequency') || '';
let income = parseFloat(localStorage.getItem('income')) || 0;
let payday = localStorage.getItem('payday') || '';
let viewMode = localStorage.getItem('viewMode') || 'payCycle';
let darkMode = localStorage.getItem('darkMode') === 'true';
let generatedPayCycles = 12; // Generate 12 months of pay cycles
let revealedPayCycles = 3; // Initially reveal 3 pay cycles

const frequencyMultipliers = { weekly: 52, fortnightly: 26, monthly: 12, yearly: 1 };

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('darkMode', darkMode);
}

function calculateYearlyIncome(frequency, income) {
    return income * (frequencyMultipliers[frequency] || 0);
}

function goToStep2() {
    payFrequency = document.getElementById('frequency').value;
    income = parseFloat(document.getElementById('income').value);
    payday = document.getElementById('payday').value;

    if (isNaN(income) || income <= 0) {
        alert("Please enter a valid positive income.");
        return;
    }

    const yearlyIncome = calculateYearlyIncome(payFrequency, income);
    const formattedPayday = new Date(payday).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });

    document.getElementById('incomeTable').innerHTML = `<tr><td>${payFrequency}</td><td class="right-align">$${income.toFixed(2)}</td><td>${formattedPayday}</td><td class="right-align">$${yearlyIncome.toFixed(2)}</td></tr>`;

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');

    setTimeout(() => {
        document.getElementById('step2').classList.remove('hidden');
        saveToLocalStorage();
        revealedPayCycles = 3; // Ensure the initial 3 pay cycles are shown
        updateAccordion();
    }, 50); // Delay to ensure proper rendering
}

function updateAccordion() {
    const accordionContainer = document.getElementById('accordionContainer');
    accordionContainer.innerHTML = '<p>Updating Accordion...</p>';

    // Simplified getCycleDates function
    function getCycleDates(startDate, cycleLength, cycles) {
        let dates = [];
        for (let i = 0; i < cycles; i++) {
            let endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + cycleLength - 1);
            dates.push({ start: new Date(startDate), end: new Date(endDate) });
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() + 1);
        }
        return dates;
    }

    // Simplified getCycleLength function
    function getCycleLength(frequency) {
        switch (frequency) {
            case 'weekly': return 7;
            case 'fortnightly': return 14;
            case 'monthly': return 30; // Approximate for simplicity
            default: return 0;
        }
    }

    // Generate cycle dates
    const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);

    accordionContainer.innerHTML = ''; // Clear initial content

    cycleDates.forEach((dates, index) => {
        if (index >= revealedPayCycles) return;

        let cycleTotal = 0;
        let cycleBills = '';
        const sortedBills = sortBillsByDate(bills);
        sortedBills.forEach(bill => {
            cycleBills += getBillRowsForCycle(bill, dates);
            cycleTotal += getBillTotalForCycle(bill, dates);
        });

        const leftoverAmount = income - cycleTotal;
        const leftoverClass = leftoverAmount >= 0 ? 'positive-amount' : 'negative-amount';
        const formattedStartDate = dates.start.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        const formattedEndDate = dates.end.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });

        accordionContainer.innerHTML += `
            <button class="accordion">
                <span>${formattedStartDate} - ${formattedEndDate}</span>
                <span class="leftover">Leftover: <span class="amount ${leftoverClass}">$${leftoverAmount.toFixed(2)}</span></span>
                <span class="arrow">▶</span>
            </button>
            <div class="panel">
                <div class="pay-cycle">
                    <table>
                        <tr><td colspan="2">Income:</td><td class="positive right-align">$${income.toFixed(2)}</td></tr>
                        <tr><td colspan="2">Total Bills:</td><td class="negative right-align">-$${cycleTotal.toFixed(2)}</td></tr>
                        ${cycleBills}
                    </table>
                </div>
            </div>
        `;
    });

    document.querySelectorAll('.accordion').forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Update chart with mock data
    updateChart({
        dates: cycleDates.map(d => d.start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })),
        totals: cycleDates.map((_, index) => {
            if (index < revealedPayCycles) {
                let cycleTotal = 0;
                sortedBills.forEach(bill => {
                    cycleTotal += getBillTotalForCycle(bill, cycleDates[index]);
                });
                return cycleTotal;
            }
            return 0;
        })
    });
}

function getBillRowsForCycle(bill, dates) {
    let rows = '', billDueDate = new Date(bill.date);
    while (billDueDate <= dates.end) {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            rows += `<tr><td>${bill.name}</td><td>${billDueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
        billDueDate = getNextBillDate(billDueDate, bill.frequency);
    }
    return rows;
}

function getBillTotalForCycle(bill, dates) {
    let total = 0, billDueDate = new Date(bill.date);
    while (billDueDate <= dates.end) {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            total += bill.amount;
        }
        billDueDate = getNextBillDate(billDueDate, bill.frequency);
    }
    return total;
}

function getNextBillDate(date, frequency) {
    switch (frequency) {
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'fortnightly': date.setDate(date.getDate() + 14); break;
        case 'monthly': date.setMonth(date.getMonth() + 1); break;
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    }
    return date;
}

function sortBillsByDate(bills) {
    return bills.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function updateChart(chartData) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    if (window.financialChart && typeof window.financialChart.destroy === 'function') {
        window.financialChart.destroy();
    }
    window.financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.dates,
            datasets: [{
                label: 'Total Bills',
                data: chartData.totals,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                    type: 'category',
                    labels: chartData.dates,
                    ticks: { autoSkip: true, maxTicksLimit: 20 },
                    title: { display: true, text: 'Start Date of Pay Cycle' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Bills' }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (income) {
        const yearlyIncome = calculateYearlyIncome(payFrequency, income);
        const formattedPayday = new Date(payday).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        document.getElementById('incomeTable').innerHTML = `<tr><td>${payFrequency}</td><td class="right-align">$${income.toFixed(2)}</td><td>${formattedPayday}</td><td class="right-align">$${yearlyIncome.toFixed(2)}</td></tr>`;
        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
    }
    updateBillsTable();
    deleteOldPayCycles();
    revealedPayCycles = 3; // Ensure the initial 3 pay cycles are shown
    updateAccordion();

    // Add event listeners if elements exist
    const resetBtn = document.getElementById('resetLocalStorageButton');
    if (resetBtn) resetBtn.addEventListener('click', resetLocalStorage);

    const loadMoreBtn = document.getElementById('loadMoreButton');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMorePayCycles);

    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) viewModeSelect.addEventListener('change', toggleViewMode);
});

function updateBillsTable() {
    const billsTable = document.getElementById('billsTable');
    let totalYearlyAmount = 0;
    billsTable.innerHTML = `<tr><th>Bill Name</th><th class="right-align">Bill Amount</th><th>Bill Frequency</th><th>Next Due Date</th><th class="right-align">12-Monthly Total Amount</th><th>Actions</th></tr>`;
    const sortedBills = sortBillsByDate(bills);
    sortedBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount += yearlyAmount;
        billsTable.innerHTML += `<tr><td>${bill.name}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td><td>${bill.frequency}</td><td>${new Date(bill.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="right-align">-$${yearlyAmount.toFixed(2)}</td><td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td></tr>`;
    });

    const totalRow = `<tr><td colspan="4" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount">-$${totalYearlyAmount.toFixed(2)}</td><td></td></tr>`;
    billsTable.insertAdjacentHTML('beforeend', totalRow);
}

function calculateYearlyAmount(amount, frequency) {
    return amount * (frequencyMultipliers[frequency] || 0);
}

function deleteOldPayCycles() {
    const today = new Date();
    const payCycles = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
    const validPayCycles = payCycles.filter(cycle => cycle.end >= today);
    const numberOfCyclesToDelete = payCycles.length - validPayCycles.length;

    if (numberOfCyclesToDelete > 0) {
        generatedPayCycles -= numberOfCyclesToDelete;
        saveToLocalStorage();
    }
}

document.getElementById('billsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const billIndex = document.getElementById('billIndex').value,
        billName = document.getElementById('billName').value,
        billAmount = parseFloat(document.getElementById('billAmount').value),
        billFrequency = document.getElementById('billFrequency').value,
        billDate = document.getElementById('billDate').value;

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid positive bill amount.");
        return;
    }

    if (billIndex === '') {
        bills.push({ name: billName, amount: billAmount, frequency: billFrequency, date: billDate });
    } else {
        bills[billIndex] = { name: billName, amount: billAmount, frequency: billFrequency, date: billDate };
    }

    saveToLocalStorage();
    updateBillsTable();
    updateAccordion();
    resetBillForm();
    closeModal();
});

function removeBill(index) {
    bills.splice(index, 1);
    saveToLocalStorage();
    updateBillsTable();
    updateAccordion();
}

function openModal() {
    document.getElementById('billModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('billModal').style.display = 'none';
}

function openIncomeModal() {
    document.getElementById('editFrequency').value = payFrequency;
    document.getElementById('editIncome').value = income;
    document.getElementById('editPayday').value = payday;
    document.getElementById('incomeModal').style.display = 'block';
}

function closeIncomeModal() {
    document.getElementById('incomeModal').style.display = 'none';
}

function updateIncome() {
    payFrequency = document.getElementById('editFrequency').value;
    income = parseFloat(document.getElementById('editIncome').value);
    payday = document.getElementById('editPayday').value;
    saveToLocalStorage();

    const yearlyIncome = calculateYearlyIncome(payFrequency, income);
    const formattedPayday = new Date(payday).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
    document.getElementById('incomeTable').innerHTML = `<tr><td>${payFrequency}</td><td class="right-align">$${income.toFixed(2)}</td><td>${formattedPayday}</td><td class="right-align">$${yearlyIncome.toFixed(2)}</td></tr>`;

    closeIncomeModal();
    updateAccordion();
}

window.onclick = function(event) {
    if (event.target == document.getElementById('billModal')) {
        closeModal();
    }
    if (event.target == document.getElementById('incomeModal')) {
        closeIncomeModal();
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    saveToLocalStorage();
}

function resetBillForm() {
    document.getElementById('billIndex').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billFrequency').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('submitBill').textContent = 'Add Bill';
}

function editBill(index) {
    const bill = bills[index];
    document.getElementById('billIndex').value = index;
    document.getElementById('billName').value = bill.name;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billFrequency').value = bill.frequency;
    document.getElementById('billDate').value = bill.date;
    document.getElementById('submitBill').textContent = 'Save';
    openModal();
}

function toggleBillList() {
    const billsTable = document.getElementById('billsTable');
    billsTable.style.display = billsTable.style.display === 'none' ? 'table' : 'none';
}

function loadMorePayCycles() {
    revealedPayCycles += 3;
    updateAccordion();
}

function toggleViewMode() {
    viewMode = document.getElementById('viewMode').value;
    saveToLocalStorage();
    updateAccordion();
}

function getCycleLength(frequency) {
    switch (frequency) {
        case 'weekly': return 7;
        case 'fortnightly': return 14;
        case 'monthly': return 30; // Approximate for simplicity
        default: return 0;
    }
}

function resetLocalStorage() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        localStorage.clear();
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (income) {
        const yearlyIncome = calculateYearlyIncome(payFrequency, income);
        const formattedPayday = new Date(payday).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
        document.getElementById('incomeTable').innerHTML = `<tr><td>${payFrequency}</td><td class="right-align">$${income.toFixed(2)}</td><td>${formattedPayday}</td><td class="right-align">$${yearlyIncome.toFixed(2)}</td></tr>`;
        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
    }
    updateBillsTable();
    deleteOldPayCycles();
    revealedPayCycles = 3; // Ensure the initial 3 pay cycles are shown
    updateAccordion();

    // Add event listeners if elements exist
    const resetBtn = document.getElementById('resetLocalStorageButton');
    if (resetBtn) resetBtn.addEventListener('click', resetLocalStorage);

    const loadMoreBtn = document.getElementById('loadMoreButton');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMorePayCycles);

    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) viewModeSelect.addEventListener('change', toggleViewMode);
});
