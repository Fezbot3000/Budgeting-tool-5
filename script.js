// Initialize variables and load data from localStorage
let bills = JSON.parse(localStorage.getItem('bills')) || [];
let payFrequency = localStorage.getItem('payFrequency') || '';
let income = parseFloat(localStorage.getItem('income')) || 0;
let payday = localStorage.getItem('payday') || '';
let viewMode = localStorage.getItem('viewMode') || 'payCycle';
let darkMode = localStorage.getItem('darkMode') === 'true';
let generatedPayCycles = 30; // Generate 12 months of pay cycles
let revealedPayCycles = 3; // Initially reveal 3 pay cycles
let tags = JSON.parse(localStorage.getItem('tags')) || ['default'];

// Constants
const frequencyMultipliers = { 
    weekly: 52, 
    fortnightly: 26, 
    monthly: 12, 
    quarterly: 4,  
    yearly: 1 
};

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('tags', JSON.stringify(tags)); // Save tags
}

function calculateYearlyIncome(frequency, income) {
    return income * (frequencyMultipliers[frequency] || 0);
}

function calculateYearlyBills() {
    let yearlyTotal = 0;
    bills.forEach(bill => {
        yearlyTotal += calculateYearlyAmount(bill.amount, bill.frequency);
    });
    return yearlyTotal;
}

function calculateYearlyAmount(amount, frequency) {
    return amount * (frequencyMultipliers[frequency] || 0);
}

function updateIncomeTable(payFrequency, income) {
    const yearlyIncome = calculateYearlyIncome(payFrequency, income);
    const yearlyBills = calculateYearlyBills();
    const potentialSavings = yearlyIncome - yearlyBills;
    const billPercentage = yearlyIncome > 0 ? (yearlyBills / yearlyIncome) * 100 : 0;
    const savingsPercentage = yearlyIncome > 0 ? (potentialSavings / yearlyIncome) * 100 : 0;

    document.getElementById('incomeFrequency').className = 'right-align';
    document.getElementById('incomeFrequency').textContent = payFrequency;
    document.getElementById('incomeAmount').className = 'right-align';
    document.getElementById('incomeAmount').textContent = `$${income.toFixed(2)}`;
    document.getElementById('yearlyIncomeAmount').className = 'right-align';
    document.getElementById('yearlyIncomeAmount').textContent = `$${yearlyIncome.toFixed(2)}`;
    document.getElementById('yearlyBillsAmount').className = 'right-align';
    document.getElementById('yearlyBillsAmount').textContent = `-$${yearlyBills.toFixed(2)}`;
    document.getElementById('yearlyBillsPercentage').className = 'right-align';
    document.getElementById('yearlyBillsPercentage').textContent = `${billPercentage.toFixed(2)}%`;
    document.getElementById('yearlySavingsAmount').className = 'right-align';
    document.getElementById('yearlySavingsAmount').textContent = `$${potentialSavings.toFixed(2)}`;
    document.getElementById('yearlySavingsPercentage').className = 'right-align';
    document.getElementById('yearlySavingsPercentage').textContent = `${savingsPercentage.toFixed(2)}%`;
}

function goToStep2() {
    payFrequency = document.getElementById('frequency').value;
    income = parseFloat(document.getElementById('income').value);
    payday = document.getElementById('payday').value;

    if (isNaN(income) || income <= 0) {
        alert("Please enter a valid positive income.");
        return;
    }

    updateIncomeTable(payFrequency, income);

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    saveToLocalStorage();
    updateAccordion();
}

function toggleViewMode() {
    viewMode = document.getElementById('viewMode').value;
    localStorage.setItem('viewMode', viewMode);

    // Update the UI based on the selected view mode
    updateAccordion();
}


document.addEventListener('DOMContentLoaded', () => {
    // Restore the view mode from localStorage
    const savedViewMode = localStorage.getItem('viewMode') || 'payCycle';
    document.getElementById('viewMode').value = savedViewMode;

    // Update the UI based on the saved view mode
    toggleViewMode(); // Call the function to update the UI according to the saved view mode

    // Restore the state of the bills list visibility
    const billsListHidden = localStorage.getItem('billsListHidden') === 'true';
    const billsTable = document.getElementById('billsTable');
    const filterByTag = document.querySelector('.filter-by-tag');

    if (billsListHidden) {
        billsTable.classList.add('hidden');
        filterByTag.classList.add('hidden');
    } else {
        billsTable.classList.remove('hidden');
        filterByTag.classList.remove('hidden');
    }

    // Other initializations...
    if (income) {
        updateIncomeTable(payFrequency, income);
        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
    }
    updateBillsTable();
    deleteOldPayCycles();
    updateTagDropdown();

    // Set dark mode if enabled
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.container').classList.add('dark-mode');
    }
});

document.getElementById('billsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const billIndex = document.getElementById('billIndex').value,
        billName = document.getElementById('billName').value,
        billAmount = parseFloat(document.getElementById('billAmount').value),
        billFrequency = document.getElementById('billFrequency').value,
        billDate = document.getElementById('billDate').value,
        billTag = document.getElementById('billTag').value.trim();

    if (isNaN(billAmount) || billAmount <= 0) {
        alert("Please enter a valid positive bill amount.");
        return;
    }

    if (!tags.includes(billTag)) {
        tags.push(billTag); // Add new tag to tags array
    }

    const newBill = { name: billName, amount: billAmount, frequency: billFrequency, date: billDate, tag: billTag };

    if (billIndex === '') {
        bills.push(newBill);
    } else {
        bills[billIndex] = newBill;
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
    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th>Name</th>
                                    <th class="right-align">Amount</th>
                                    <th>Frequency</th>
                                    <th>Due Date</th>
                                    <th>Tag</th>
                                    <th class="right-align">Yearly Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>`;
    const sortedBills = sortBillsByDate(bills);
    sortedBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount += yearlyAmount;
        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${bill.name}</td>
            <td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td>
            <td>${bill.frequency}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${bill.tag}</td>
            <td class="right-align">-$${yearlyAmount.toFixed(2)}</td>
            <td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td>
        </tr>`;
    });

    const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount">-$${totalYearlyAmount.toFixed(2)}</td><td></td></tr>`;
    billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);

    // Automatically update the income table after updating bills
    updateIncomeTable(payFrequency, income);
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
    const filterByTag = document.querySelector('.filter-by-tag');

    // Toggle visibility
    billsTable.classList.toggle('hidden');
    filterByTag.classList.toggle('hidden');

    // Save the current state in localStorage
    const isHidden = billsTable.classList.contains('hidden');
    localStorage.setItem('billsListHidden', isHidden);
}

function editBill(index) {
    const bill = bills[index];
    document.getElementById('billIndex').value = index;
    document.getElementById('billName').value = bill.name;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billFrequency').value = bill.frequency;
    document.getElementById('billDate').value = bill.date;
    document.getElementById('billTag').value = bill.tag;
    document.getElementById('submitBill').textContent = 'Save';
    openModal();
}

function resetBillForm() {
    document.getElementById('billIndex').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billFrequency').value = '';
    document.getElementById('billDate').value = '';
    document.getElementById('billTag').value = 'default';
    document.getElementById('submitBill').textContent = 'Add Bill';
}

function updateAccordion() {
    const accordionContainer = document.getElementById('accordionContainer');
    accordionContainer.innerHTML = ''; // Clear existing content

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
            const formattedStartDate = formatDate(dates.start);
            const formattedEndDate = formatDate(dates.end);

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
            if (index >= revealedPayCycles) return;

            const monthTotal = chartData.totals[index],
                billsForMonth = chartData.bills[index],
                monthIncome = chartData.incomes[index],
                leftoverAmount = monthIncome - monthTotal,
                leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';

            accordionContainer.innerHTML += `
                <div class="cycle-summary">
                    <div class="cycle-info">
                        <span class="left-align">Next cycle:</span>
                        <span class="right-align">${monthYear}</span>
                    </div>
                    <div class="income-summary">
                        <p>Income: <span class="positive">$${monthIncome.toFixed(2)}</span></p>
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

    // Re-attach event listeners to newly created accordion buttons
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

    // Update the chart with the new data
    updateChart(chartData);
}

function sortBillsByDate(bills) {
    return bills.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getCycleLength(frequency, referenceDate) {
    switch (frequency) {
        case 'weekly': 
            return 7;
        case 'fortnightly': 
            return 14;
        case 'monthly': 
            const currentMonth = referenceDate.getMonth();
            const currentYear = referenceDate.getFullYear();
            return new Date(currentYear, currentMonth + 1, 0).getDate();
        case 'quarterly': 
            return 90; // Average days in a quarter
        case 'yearly': 
            return 365;
        default: 
            return 0;
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
            rows += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                rows += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
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

    const totalMonths = 18; // Adjust this value as needed

    let date = new Date(payday);
    let endViewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + totalMonths, 0);

    // Generate all pay dates within the range
    while (date <= endViewDate) {
        payDates.push(new Date(date));
        date = adjustDate(getNextBillDate(new Date(date), payFrequency));
    }

    for (let i = 0; i < totalMonths; i++) {
        let startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        let monthName = startDate.toLocaleString('default', { month: 'long' });
        monthlyData.dates.push(`${monthName} ${currentDate.getFullYear()}`);

        let monthTotal = 0;
        let monthBills = '';
        let monthIncome = 0;
        let monthPayDates = [];

        // Calculate income for the month based on pay dates
        payDates.forEach(payDate => {
            const payDateStartOfDay = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

            if (payDateStartOfDay >= startDate && payDateStartOfDay <= endDate) {
                monthIncome += income;
                monthPayDates.push(payDate.toDateString());
            }
        });

        monthlyData.incomes.push(monthIncome);
        monthlyData.payDates.push(monthPayDates);

        // Process monthly bills first
        bills.forEach(bill => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === 'monthly') {
                // Ensure the bill shows up in every month
                if (billDueDate.getDate() > endDate.getDate()) {
                    billDueDate.setDate(endDate.getDate());
                }
                monthBills += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
                monthTotal += bill.amount;
            }
        });

        // Process weekly and fortnightly bills, showing them multiple times within the month
        bills.forEach(bill => {
            if (bill.frequency === 'weekly' || bill.frequency === 'fortnightly') {
                let billDueDate = new Date(bill.date);
                while (billDueDate <= endDate) {
                    if (billDueDate >= startDate && billDueDate <= endDate) {
                        monthBills += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
                        monthTotal += bill.amount;
                    }
                    billDueDate = adjustDate(getNextBillDate(billDueDate, bill.frequency));
                }
            }
        });

        // Process quarterly and yearly bills, showing them only in the correct month
        bills.forEach(bill => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === 'quarterly') {
                if ((billDueDate.getMonth() % 3 === startDate.getMonth() % 3) &&
                    billDueDate.getFullYear() === startDate.getFullYear()) {
                    monthBills += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
                    monthTotal += bill.amount;
                }
            } else if (bill.frequency === 'yearly') {
                if (billDueDate.getMonth() === startDate.getMonth()) {
                    monthBills += `<tr><td>${bill.name}</td><td>${formatDate(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
                    monthTotal += bill.amount;
                }
            }
        });

        monthlyData.totals.push(monthTotal);
        monthlyData.bills.push(monthBills);
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
    const originalDay = date.getDate();
    
    switch (frequency) {
        case 'weekly': 
            date.setDate(date.getDate() + 7); 
            break;
        case 'fortnightly': 
            date.setDate(date.getDate() + 14); 
            break;
        case 'monthly': 
            date.setMonth(date.getMonth() + 1);
            if (date.getDate() < originalDay) {
                // Adjust to the last day of the month if the original day doesn't exist
                date.setDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
            }
            break;
        case 'quarterly': 
            date.setMonth(date.getMonth() + 3);
            if (date.getDate() < originalDay) {
                date.setDate(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
            }
            break;
        case 'yearly': 
            date.setFullYear(date.getFullYear() + 1); 
            break;
    }
    return date;
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
            const formattedStartDate = formatDate(dates.start);
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
    updateTagDropdown();
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
    updateIncomeTable(payFrequency, income);

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

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    saveToLocalStorage();
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

// Tag Management Functions
function updateTagDropdown() {
    const tagList = document.getElementById('tagList');
    const existingTagSelect = document.getElementById('existingTag');
    const tagFilter = document.getElementById('tagFilter');
    
    tagList.innerHTML = '';
    existingTagSelect.innerHTML = '';
    tagFilter.innerHTML = '<option value="all">All</option>'; // Reset and add "All" option

    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        tagList.appendChild(option);

        const selectOption = document.createElement('option');
        selectOption.value = tag;
        selectOption.textContent = tag;
        existingTagSelect.appendChild(selectOption);

        const filterOption = document.createElement('option');
        filterOption.value = tag;
        filterOption.textContent = tag;
        tagFilter.appendChild(filterOption);
    });
}

function loadTagInfo() {
    const existingTag = document.getElementById('existingTag').value;
    document.getElementById('newTagName').value = existingTag;
}

function openManageTagsModal() {
    document.getElementById('manageTagsModal').style.display = 'block';
    updateTagDropdown();
}

function closeTagModal() {
    document.getElementById('manageTagsModal').style.display = 'none';
}

function renameTag() {
    const oldTag = document.getElementById('existingTag').value;
    const newTag = document.getElementById('newTagName').value.trim();

    if (!newTag) {
        alert("New tag name cannot be empty.");
        return;
    }

    const tagIndex = tags.indexOf(oldTag);
    if (tagIndex > -1) {
        tags[tagIndex] = newTag;

        bills.forEach(bill => {
            if (bill.tag === oldTag) {
                bill.tag = newTag;
            }
        });

        saveToLocalStorage();
        updateBillsTable();
        updateTagDropdown();
        alert("Tag renamed successfully.");
    }
}

function deleteTag() {
    const tagToDelete = document.getElementById('existingTag').value;

    if (tagToDelete === 'default') {
        alert("Cannot delete the default tag.");
        return;
    }

    tags = tags.filter(tag => tag !== tagToDelete);

    bills.forEach(bill => {
        if (bill.tag === tagToDelete) {
            bill.tag = 'default';
        }
    });

    saveToLocalStorage();
    updateBillsTable();
    updateTagDropdown();
    alert("Tag deleted successfully.");

    // Close the tag modal after deletion
    closeTagModal();
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const d = new Date(date);
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let daySuffix;

    if (day > 3 && day < 21) {
        daySuffix = 'th'; // 'th' for 4-20
    } else {
        switch (day % 10) {
            case 1:  daySuffix = "st"; break;
            case 2:  daySuffix = "nd"; break;
            case 3:  daySuffix = "rd"; break;
            default: daySuffix = "th";
        }
    }

    return `${dayOfWeek} ${day}${daySuffix} ${month} - ${year}`;
}

function filterByTag() {
    const selectedTag = document.getElementById('tagFilter').value;
    const billsTable = document.getElementById('billsTable');
    const filteredBills = selectedTag === 'all' ? bills : bills.filter(bill => bill.tag === selectedTag);

    let totalYearlyAmount = 0;
    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th>Name</th>
                                    <th class="right-align">Amount</th>
                                    <th>Frequency</th>
                                    <th>Due Date</th>
                                    <th>Tag</th>
                                    <th class="right-align">Yearly Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>`;

    filteredBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount += yearlyAmount;
        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${bill.name}</td>
            <td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td>
            <td>${bill.frequency}</td>
            <td>${formatDate(bill.date)}</td>
            <td>${bill.tag}</td>
            <td class="right-align">-$${yearlyAmount.toFixed(2)}</td>
            <td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td>
        </tr>`;
    });

    const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount">-$${totalYearlyAmount.toFixed(2)}</td><td></td></tr>`;
    billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);
}

function exportData() {
    const data = {
        bills: bills,
        payFrequency: payFrequency,
        income: income,
        payday: payday,
        viewMode: viewMode,
        darkMode: darkMode,
        tags: tags
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            bills = data.bills || [];
            payFrequency = data.payFrequency || '';
            income = parseFloat(data.income) || 0;
            payday = data.payday || '';
            viewMode = data.viewMode || 'payCycle';
            darkMode = data.darkMode === true;
            tags = data.tags || ['default']; // Import tags

            saveToLocalStorage();
            updateBillsTable();
            updateAccordion();
            if (darkMode) {
                document.body.classList.add('dark-mode');
                document.querySelector('.container').classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                document.querySelector('.container').classList.remove('dark-mode');
            }

            updateIncomeTable(payFrequency, income);
        };
        reader.readAsText(file);
    }
}

function autocompleteTag() {
    const tagInput = document.getElementById('billTag');
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = ''; // Clear previous suggestions

    const inputValue = tagInput.value.toLowerCase();
    if (inputValue) {
        const filteredTags = tags.filter(tag => tag.toLowerCase().includes(inputValue));
        filteredTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            tagList.appendChild(option);
        });
    }
}

document.getElementById('billTag').addEventListener('input', autocompleteTag);
