// Initialize variables and load data from localStorage
let bills = JSON.parse(localStorage.getItem('bills')) || [];
let payFrequency = localStorage.getItem('payFrequency') || '';
let income = parseFloat(localStorage.getItem('income')) || 0;
let payday = localStorage.getItem('payday') || '';
let viewMode = localStorage.getItem('viewMode') || 'payCycle';
let darkMode = localStorage.getItem('darkMode') === 'true';
let generatedPayCycles = 12; // Generate 12 months of pay cycles
let revealedPayCycles = 3; // Initially reveal 3 pay cycles

// Constants
const frequencyMultipliers = { weekly: 52, fortnightly: 26, monthly: 12, yearly: 1 };

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('darkMode', darkMode);
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
    document.getElementById('step2').classList.remove('hidden');
    saveToLocalStorage();
    updateAccordion();
}

function calculateYearlyIncome(frequency, income) {
    return income * (frequencyMultipliers[frequency] || 0);
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
    deleteOldPayCycles(); // Call the function to delete old pay cycles
    updateAccordion();

    // Set dark mode if enabled
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.container').classList.add('dark-mode');
    }

    // Add event listeners here
    const addBillButton = document.getElementById('addBillButton');
    const closeBillModal = document.getElementById('closeBillModal');
    const addIncomeButton = document.getElementById('addIncomeButton');
    const closeIncomeModal = document.getElementById('closeIncomeModal');
    const loadMoreButton = document.getElementById('loadMoreButton');
    const resetLocalStorageButton = document.getElementById('resetLocalStorageButton');

    if (addBillButton) addBillButton.addEventListener('click', openModal);
    if (closeBillModal) closeBillModal.addEventListener('click', closeModal);
    if (addIncomeButton) addIncomeButton.addEventListener('click', openIncomeModal);
    if (closeIncomeModal) closeIncomeModal.addEventListener('click', closeIncomeModal);
    if (loadMoreButton) loadMoreButton.addEventListener('click', loadMorePayCycles);
    if (resetLocalStorageButton) resetLocalStorageButton.addEventListener('click', resetLocalStorage);
});

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

function calculateYearlyBills() {
    let yearlyTotal = 0;
    bills.forEach(bill => {
        yearlyTotal += calculateYearlyAmount(bill.amount, bill.frequency);
    });
    const yearlyBillsAmountElement = document.getElementById('yearlyBillsAmount');
    if (yearlyBillsAmountElement) {
        yearlyBillsAmountElement.innerText = `Total Yearly Bill Amount: $${yearlyTotal.toFixed(2)}`;
    }
}

function removeBill(index) {
    bills.splice(index, 1);
    saveToLocalStorage();
    updateBillsTable();
    updateAccordion(); // Ensure pay cycles are updated
    calculateYearlyBills();
}

function toggleBillList() {
    const billsTable = document.getElementById('billsTable');
    billsTable.style.display = billsTable.style.display === 'none' ? 'table' : 'none';
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

function resetBillForm() {
    document.getElementById('billIndex').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billFrequency').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('submitBill').textContent = 'Add Bill';
}

function toggleViewMode() {
    viewMode = document.getElementById('viewMode').value;
    saveToLocalStorage();
    updateAccordion();
}

function updateAccordion() {
    const accordionContainer = document.getElementById('accordionContainer');
    accordionContainer.innerHTML = '';
    let cycleDates, chartData;

    if (viewMode === 'payCycle') {
        cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
        chartData = { dates: [], totals: [] };

        cycleDates.forEach((dates, index) => {
            if (index >= revealedPayCycles) return;
            let cycleTotal = 0,
                cycleBills = '';
            const sortedBills = sortBillsByDate(bills);
            sortedBills.forEach(bill => {
                cycleBills += getBillRowsForCycle(bill, dates);
                cycleTotal += getBillTotalForCycle(bill, dates);
            });
            const leftoverAmount = income - cycleTotal;
            const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';
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
                <div class="cycle-summary">
                    <div class="cycle-info">
                        <span class="left-align">Next cycle:</span>
                        <span class="right-align">${formattedStartDate} - ${formattedEndDate}</span>
                    </div>
                    <div class="income-summary">
                        <p>Income: <span class="positive">$${income.toFixed(2)}</span></p>
                        <p>Estimated to pay: <span class="negative">-$${cycleTotal.toFixed(2)}</span></p>
                        <p>Leftover: <span class="${leftoverClass}">$${leftoverAmount.toFixed(2)}</span></p>
                    </div>
                    <button class="accordion-btn">
                        <span>${formattedStartDate}</span>
                        <span class="toggle-text">Show</span>
                    </button>
                    <div class="panel-content" style="display: none;">
                        <table>
                            ${cycleBills}
                        </table>
                    </div>
                </div>
            `;
            chartData.dates.push(formattedStartDate);
            chartData.totals.push(cycleTotal);
        });
    } else if (viewMode === 'monthly') {
        chartData = calculateMonthlyView();
        chartData.dates.forEach((monthYear, index) => {
            const monthTotal = chartData.totals[index],
                billsForMonth = chartData.bills[index],
                monthIncome = chartData.incomes[index],
                payDatesForMonth = chartData.payDates[index],
                leftoverAmount = monthIncome - monthTotal,
                leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';

            if (index >= revealedPayCycles) return;
            accordionContainer.innerHTML += `
                <div class="cycle-summary">
                    <div class="cycle-info">
                        <span class="left-align">Next cycle:</span>
                        <span class="right-align">${monthYear}</span>
                    </div>
                    <div class="income-summary">
                        <p>Income (${payDatesForMonth.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })).join(', ')}): <span class="positive">$${monthIncome.toFixed(2)}</span></p>
                        <p>Estimated to pay: <span class="negative">-$${monthTotal.toFixed(2)}</span></p>
                        <p>Leftover: <span class="${leftoverClass}">$${leftoverAmount.toFixed(2)}</span></p>
                    </div>
                    <button class="accordion-btn">
                        <span>${monthYear}</span>
                        <span class="toggle-text">Show</span>
                    </button>
                    <div class="panel-content" style="display: none;">
                        <table>
                            ${billsForMonth}
                        </table>
                    </div>
                </div>
            `;
        });
    }

    document.querySelectorAll('.accordion-btn').forEach(button => {
        button.addEventListener('click', function () {
            const panel = this.nextElementSibling;
            if (panel.style.display === 'block') {
                panel.style.display = 'none';
                this.querySelector('.toggle-text').textContent = 'Show';
            } else {
                panel.style.display = 'block';
                this.querySelector('.toggle-text').textContent = 'Hide';
            }
        });
    });

    updateChart(chartData);
}

function sortBillsByDate(bills) {
    return bills.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getCycleLength(frequency) {
    switch (frequency) {
        case 'weekly': return 7;
        case 'fortnightly': return 14;
        case 'monthly': return (new Date(new Date().setMonth(new Date().getMonth() + 1)) - new Date()) / (1000 * 60 * 60 * 24);
        default: return 0;
    }
}

function getCycleDates(startDate, cycleLength, cycles) {
    let dates = [];
    for (let i = 0; i < cycles; i++) {
        let endDate = new Date(startDate);
        if (payFrequency === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
        } else {
            endDate.setDate(endDate.getDate() + cycleLength - 1);
        }
        dates.push({ start: new Date(startDate), end: new Date(endDate) });
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() + 1);
    }
    return dates;
}

function getBillRowsForCycle(bill, dates) {
    let rows = '', billDueDate = new Date(bill.date);
    if (bill.frequency === 'yearly') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            rows += `<tr><td>${bill.name}</td><td>${billDueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                rows += `<tr><td>${bill.name}</td><td>${billDueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            }
            billDueDate = adjustDate(getNextBillDate(billDueDate, bill.frequency));
        }
    }
    return rows;
}

function getBillTotalForCycle(bill, dates) {
    let total = 0, billDueDate = new Date(bill.date);
    if (bill.frequency === 'yearly') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            total += bill.amount;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                total += bill.amount;
            }
            billDueDate = adjustDate(getNextBillDate(billDueDate, bill.frequency));
        }
    }
    return total;
}

function calculateMonthlyView() {
    let monthlyData = { dates: [], totals: [], bills: [], incomes: [], payDates: [] };
    let currentDate = new Date(payday);
    let payDates = [];

    // Generate all pay dates within the view range
    let date = new Date(payday);
    let endViewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + generatedPayCycles, 0);
    while (date <= endViewDate) {
        payDates.push(new Date(date));
        date = adjustDate(getNextBillDate(new Date(date), payFrequency));
    }

    for (let i = 0; i < generatedPayCycles; i++) {
        let startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        let monthName = startDate.toLocaleString('default', { month: 'long' });
        monthlyData.dates.push(`${monthName} ${currentDate.getFullYear()}`);

        let monthTotal = 0;
        let monthBills = '';
        let monthIncome = 0;
        let monthPayDates = [];

        // Calculate total income for the month
        payDates.forEach(payDate => {
            const payDateStartOfDay = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

            if (payDateStartOfDay >= startDate && payDateStartOfDay <= endDate) {
                monthIncome += income;
                monthPayDates.push(payDate.toDateString());
            }
        });

        // Calculate total bills for the month
        const sortedBills = sortBillsByDate(bills); // Ensure bills are sorted by date
        sortedBills.forEach(bill => {
            let billDueDate = new Date(bill.date);
            while (billDueDate <= endDate) {
                if (billDueDate >= startDate && billDueDate <= endDate) {
                    billDueDate = adjustDate(billDueDate); // Ensure the bill date is adjusted
                    monthBills += `<tr><td>${bill.name}</td><td>${billDueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
                    monthTotal += bill.amount;
                }
                billDueDate = getNextBillDate(billDueDate, bill.frequency);
                if (billDueDate > endDate) break; // Break the loop if the next due date is beyond the end of the month
            }
        });

        monthlyData.totals.push(monthTotal);
        monthlyData.bills.push(monthBills);
        monthlyData.incomes.push(monthIncome);
        monthlyData.payDates.push(monthPayDates);

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData;
}

function adjustDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    // Move date to the last valid date of the month if it exceeds the number of days in the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    if (day > lastDayOfMonth) {
        date.setDate(lastDayOfMonth);
    }

    return date;
}

function getNextBillDate(date, frequency) {
    switch (frequency) {
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'fortnightly': date.setDate(date.getDate() + 14); break;
        case 'monthly': 
            let currentDay = date.getDate();
            date.setMonth(date.getMonth() + 1);
            if (date.getDate() < currentDay) {
                date.setDate(0); // This sets the date to the last day of the previous month
            }
            break;
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    }
    return adjustDate(date);
}

function loadMorePayCycles() {
    revealedPayCycles += 3; // Increase the number of revealed cycles
    updateAccordion();
    // Ensure the chart is updated
    if (viewMode === 'payCycle') {
        const cycleDates = getCycleDates(new Date(payday), getCycleLength(payFrequency), generatedPayCycles);
        const chartData = { dates: [], totals: [] };

        cycleDates.forEach((dates, index) => {
            if (index >= revealedPayCycles) return;
            let cycleTotal = 0;
            const sortedBills = sortBillsByDate(bills);
            sortedBills.forEach(bill => {
                cycleTotal += getBillTotalForCycle(bill, dates);
            });
            const formattedStartDate = dates.start.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
            chartData.dates.push(formattedStartDate);
            chartData.totals.push(cycleTotal);
        });

        updateChart(chartData);
    } else if (viewMode === 'monthly') {
        const chartData = calculateMonthlyView();
        updateChart(chartData);
    }
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

function resetLocalStorage() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        localStorage.clear();
        window.location.href = window.location.href;
    }
}

// Modal functions
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

    // Update the income table without reloading
    const yearlyIncome = calculateYearlyIncome(payFrequency, income);
    const formattedPayday = new Date(payday).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
    document.getElementById('incomeTable').innerHTML = `<tr><td>${payFrequency}</td><td class="right-align">$${income.toFixed(2)}</td><td>${formattedPayday}</td><td class="right-align">$${yearlyIncome.toFixed(2)}</td></tr>`;

    // Close modal
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

// Dark mode toggle function
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    saveToLocalStorage();
}

// Function to delete old pay cycles
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
    deleteOldPayCycles(); // Call the function to delete old pay cycles
    updateAccordion();
});
