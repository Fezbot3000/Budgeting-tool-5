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
let oneOffIncomes = JSON.parse(localStorage.getItem('oneOffIncomes')) || []; // Load one-off incomes

// Load saved sortOrder from localStorage or use default values
let sortOrder;
try {
    sortOrder = JSON.parse(localStorage.getItem('sortOrder')) || {
        name: 'asc',
        amount: 'asc',
        frequency: 'asc',
        date: 'asc',
        tag: 'asc',
        totalAmount: 'asc'
    };
} catch (e) {
    console.error("Error parsing sortOrder from localStorage:", e);
    sortOrder = {
        name: 'asc',
        amount: 'asc',
        frequency: 'asc',
        date: 'asc',
        tag: 'asc',
        totalAmount: 'asc'
    };
}

// Constants
const frequencyMultipliers = { 
    weekly: 52, 
    fortnightly: 26, 
    monthly: 12, 
    quarterly: 4,  
    yearly: 1,
    "one-off": 0 // No multiplier for one-off bills
};

function saveToLocalStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
    localStorage.setItem('payFrequency', payFrequency);
    localStorage.setItem('income', income.toString());
    localStorage.setItem('payday', payday);
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('tags', JSON.stringify(tags)); // Save tags
    localStorage.setItem('oneOffIncomes', JSON.stringify(oneOffIncomes)); // Save one-off incomes
    localStorage.setItem('sortOrder', JSON.stringify(sortOrder)); // Save sortOrder
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
    if (frequency === 'one-off') {
        return amount; // No multiplication for one-off amounts
    }
    return amount * (frequencyMultipliers[frequency] || 0);
}

function updateIncomeTable(payFrequency, income) {
    let totalOneOffIncome = oneOffIncomes.reduce((total, income) => total + income.amount, 0);
    const yearlyIncome = calculateYearlyIncome(payFrequency, income) + totalOneOffIncome;
    const yearlyBills = calculateYearlyBills();
    const potentialSavings = yearlyIncome - yearlyBills;
    const billPercentage = yearlyIncome > 0 ? (yearlyBills / yearlyIncome) * 100 : 0;
    const savingsPercentage = yearlyIncome > 0 ? (potentialSavings / yearlyIncome) * 100 : 0;

    document.getElementById('incomeFrequency').className = '';
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

    if (!payFrequency || !payday) {
        alert("Please ensure all fields are filled out correctly.");
        return;
    }

    updateIncomeTable(payFrequency, income);
    saveToLocalStorage();

    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');

    // Show the chart when moving to Step 2
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        chartContainer.style.display = 'block';
    }

    // Reload the page to ensure the pay cycles are shown correctly
    location.reload();
}

function toggleViewMode() {
    viewMode = document.getElementById('viewMode').value;
    localStorage.setItem('viewMode', viewMode);

    // Update the UI based on the selected view mode
    updateAccordion();
}

document.addEventListener('DOMContentLoaded', () => {
    // Load the saved view mode from localStorage
    viewMode = localStorage.getItem('viewMode') || 'payCycle'; // Default to 'payCycle' if not set
    document.getElementById('viewMode').value = viewMode; // Set the dropdown to the saved value

    // Update the sort icons based on the initial sortOrder
    updateSortArrows();  // Call this function to initialize the sort arrows

    // Don't run these functions until the necessary data is available
    if (payFrequency && payday) {
        toggleViewMode();
        updateBillsTable();
        deleteOldPayCycles();
        updateAccordion();

        if (income > 0) {
            updateIncomeTable(payFrequency, income);
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
        }
    } else {
        console.log("Waiting for user input on Step 1...");
    }

    // Other initializations...
    updateTagDropdown();

    // Set dark mode if enabled
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.container').classList.add('dark-mode');
    }

    // Check if the browser supports service workers and register one
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                // Registration successful
            })
            .catch(error => {
                // Registration failed
            });
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

// One-Off Income Functions
function saveOneOffIncomesToLocalStorage() {
    localStorage.setItem('oneOffIncomes', JSON.stringify(oneOffIncomes));
}

function openOneOffIncomeModal() {
    document.getElementById('oneOffIncomeModal').style.display = 'block';
}

function closeOneOffIncomeModal() {
    document.getElementById('oneOffIncomeModal').style.display = 'none';
}

document.getElementById('oneOffIncomeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const incomeIndex = document.getElementById('incomeIndex').value;
    const incomeName = document.getElementById('incomeName').value;
    const incomeAmountInput = document.getElementById('oneOffIncomeAmount');  // Use the original ID

    if (!incomeAmountInput) {
        console.error("Input element for income amount not found.");
        return;
    }

    let incomeAmountRaw = incomeAmountInput.value.trim();

    if (incomeAmountRaw === "" || incomeAmountRaw === null) {
        alert("Income amount cannot be empty.");
        return;
    }

    let incomeAmount = parseFloat(incomeAmountRaw.replace(/,/g, ''));

    if (isNaN(incomeAmount) || incomeAmount <= 0) {
        alert("Please enter a valid positive income amount.");
        return;
    }

    const incomeDate = document.getElementById('incomeDate').value;
    const newIncome = { name: incomeName, amount: incomeAmount, date: incomeDate };
    
    if (incomeIndex === '') {
        oneOffIncomes.push(newIncome);
    } else {
        oneOffIncomes[incomeIndex] = newIncome;
    }

    saveOneOffIncomesToLocalStorage();
    updateIncomeTableWithOneOffIncomes();
    closeOneOffIncomeModal();
    resetIncomeForm();
});

function resetIncomeForm() {
    document.getElementById('incomeIndex').value = '';
    document.getElementById('incomeName').value = '';
    document.getElementById('oneOffIncomeAmount').value = '';
    document.getElementById('incomeDate').value = '';
    document.getElementById('submitOneOffIncome').textContent = 'Add Income';
}

// Update the income table with the one-off incomes
function updateIncomeTableWithOneOffIncomes() {
    let totalOneOffIncome = oneOffIncomes.reduce((total, income) => total + income.amount, 0);
    console.log("Total One-Off Income:", totalOneOffIncome);

    const yearlyIncome = calculateYearlyIncome(payFrequency, income) + totalOneOffIncome;
    const yearlyBills = calculateYearlyBills();
    const potentialSavings = yearlyIncome - yearlyBills;
    const billPercentage = yearlyIncome > 0 ? (yearlyBills / yearlyIncome) * 100 : 0;
    const savingsPercentage = yearlyIncome > 0 ? (potentialSavings / yearlyIncome) * 100 : 0;

    document.getElementById('yearlyIncomeAmount').textContent = `$${yearlyIncome.toFixed(2)}`;
    document.getElementById('yearlySavingsAmount').textContent = `$${potentialSavings.toFixed(2)}`;
    document.getElementById('yearlySavingsPercentage').textContent = `${savingsPercentage.toFixed(2)}%`;

    updateAccordion();
    updateBillsTable();
}

function updateBillDueDatesForDisplay() {
    const today = new Date();
    return bills.map(bill => {
        let displayBill = { ...bill };  // Clone the original bill object
        let billDueDate = new Date(displayBill.date);

        // Adjust the date forward if it's in the past
        while (billDueDate < today) {
            billDueDate = getNextBillDate(billDueDate, displayBill.frequency);
        }

        displayBill.displayDate = billDueDate.toISOString().split('T')[0];
        return displayBill;
    });
}

function updateBillsTable() {
    const billsTable = document.getElementById('billsTable');
    let totalYearlyAmount = 0;

    const adjustedBills = updateBillDueDatesForDisplay();

    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th onclick="sortTable('name')">Name <span id="nameSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('amount')">Amount <span id="amountSortArrow">↑</span></th>
                                    <th onclick="sortTable('frequency')">Frequency <span id="frequencySortArrow">↑</span></th>
                                    <th onclick="sortTable('date')">Due Date <span id="dateSortArrow">↑</span></th>
                                    <th onclick="sortTable('tag')">Tag <span id="tagSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('totalAmount')">Yearly Total <span id="totalAmountSortArrow">↑</span></th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>`;

    const sortedBills = sortBills(adjustedBills); // Call sortBills to get the sorted array

    // Subtract bill amounts (as they are expenses)
    sortedBills.forEach((bill, index) => {
        const yearlyAmount = calculateYearlyAmount(bill.amount, bill.frequency);
        totalYearlyAmount -= yearlyAmount; // Subtract the yearly bill amounts

        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${bill.name}</td>
            <td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td>
            <td>${bill.frequency}</td>
            <td>${formatDate(bill.displayDate)}</td>
            <td>${bill.tag}</td>
            <td class="right-align">-$${yearlyAmount.toFixed(2)}</td>
            <td><button class="secondary-btn" onclick="editBill(${index})">Edit</button> <button class="delete-btn" onclick="removeBill(${index})">Delete</button></td>
        </tr>`;
    });

    // Add one-off incomes (as they are income)
    oneOffIncomes.forEach((income, index) => {
        totalYearlyAmount += income.amount; // Add the income amounts

        billsTable.querySelector('tbody').innerHTML += `<tr>
            <td>${income.name}</td>
            <td class="positive right-align">+$${income.amount.toFixed(2)}</td>
            <td>One-Off</td>
            <td>${formatDate(income.date)}</td>
            <td>One-Off</td>
            <td class="right-align">+$${income.amount.toFixed(2)}</td>
            <td>
                <button class="secondary-btn" onclick="editOneOffIncome(${index})">Edit</button>
                <button class="delete-btn" onclick="removeOneOffIncome(${index})">Delete</button>
            </td>
        </tr>`;
    });

    // Display the correct total at the bottom
    const totalRow = `<tr><td colspan="5" class="total-label">Total Yearly Amount:</td><td class="right-align total-amount">${totalYearlyAmount < 0 ? '-' : ''}$${Math.abs(totalYearlyAmount).toFixed(2)}</td><td></td></tr>`;
    billsTable.querySelector('tbody').insertAdjacentHTML('beforeend', totalRow);

    updateIncomeTable(payFrequency, income);
}

function sortTable(column) {
    const rows = Array.from(document.querySelector('#billsTable tbody').rows);
    const totalRow = rows.pop(); // Remove the last row (total row) from sorting

    rows.sort((a, b) => {
        let valA = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();
        let valB = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent.trim();

        if (column === 'amount' || column === 'totalAmount') {
            valA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
            valB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
        } else if (column === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (sortOrder[column] === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });

    sortOrder[column] = sortOrder[column] === 'asc' ? 'desc' : 'asc';

    const tbody = document.querySelector('#billsTable tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    tbody.appendChild(totalRow);

    updateSortArrows(column);
    saveToLocalStorage(); // Save sortOrder to localStorage
}

function sortBills(bills) {
    const sortKey = Object.keys(sortOrder).find(key => sortOrder[key] !== null);
    const sortDirection = sortOrder[sortKey];

    return bills.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'amount' || sortKey === 'totalAmount') {
            valA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
            valB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
        } else if (sortKey === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (sortDirection === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
}

function getColumnIndex(column) {
    switch (column) {
        case 'name': return 1;
        case 'amount': return 2;
        case 'frequency': return 3;
        case 'date': return 4;
        case 'tag': return 5;
        case 'totalAmount': return 6; // Correct column index for Yearly Total
        default: return 0;
    }
}

function updateSortArrows(column) {
    const columns = ['name', 'amount', 'frequency', 'date', 'tag', 'totalAmount'];
    columns.forEach(col => {
        const arrow = document.getElementById(`${col}SortArrow`);
        if (arrow) {
            // Reset arrow classes
            arrow.textContent = ''; // Clear the existing icon

            // Apply the correct class based on the sorting order
            if (col === column) {
                arrow.textContent = sortOrder[column] === 'asc' ? '↑' : '↓';
            }
        }
    });
}

function removeBill(index) {
    const confirmed = confirm("Are you sure you want to delete this bill? This action cannot be undone.");
    if (confirmed) {
        bills.splice(index, 1);
        saveToLocalStorage();
        updateBillsTable();
        updateAccordion();
        calculateYearlyBills();
    }
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

function editOneOffIncome(index) {
    const income = oneOffIncomes[index];
    if (income) {
        document.getElementById('incomeName').value = income.name;
        document.getElementById('oneOffIncomeAmount').value = income.amount.toFixed(2); // Ensure the value is properly formatted
        document.getElementById('incomeDate').value = income.date;
        document.getElementById('incomeIndex').value = index;  // Use a hidden input to track the index

        document.getElementById('submitOneOffIncome').textContent = 'Save Income';
        openOneOffIncomeModal();
    }
}

function removeOneOffIncome(index) {
    const confirmed = confirm("Are you sure you want to delete this one-off income? This action cannot be undone.");
    if (confirmed) {
        oneOffIncomes.splice(index, 1);
        saveOneOffIncomesToLocalStorage();
        updateIncomeTableWithOneOffIncomes();
        updateBillsTable();
        updateAccordion();
    }
}

function editBill(index) {
    const bill = bills[index];

    if (bill) {
        document.getElementById('billIndex').value = index;
        document.getElementById('billName').value = bill.name;
        document.getElementById('billAmount').value = bill.amount;
        document.getElementById('billFrequency').value = bill.frequency;
        document.getElementById('billDate').value = bill.date;
        document.getElementById('billTag').value = bill.tag;

        document.getElementById('submitBill').textContent = 'Save';

        openModal(true);  // Pass true to indicate this is an edit
    }
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

function adjustDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    if (day > lastDayOfMonth) {
        date.setDate(lastDayOfMonth);
    }

    return date;
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

            let cycleTotal = 0;
            let cycleIncome = income;  // Start with regular income
            let cycleBills = '';

            // Calculate bills for this cycle
            const sortedBills = sortBillsByDate(bills);
            sortedBills.forEach(bill => {
                cycleBills += getBillRowsForCycle(bill, dates);
                cycleTotal += getBillTotalForCycle(bill, dates);
            });

            // Add one-off incomes that fall within this pay cycle
            oneOffIncomes.forEach(incomeItem => {
                const incomeDate = new Date(incomeItem.date);
                if (incomeDate >= dates.start && incomeDate <= dates.end) {
                    cycleIncome += incomeItem.amount;  // Add one-off income to cycle income
                    // Ensure positive income is displayed in green and format date consistently
                    cycleBills += `<tr><td>${incomeItem.name}</td><td>${formatDate(incomeDate)}</td><td class="positive right-align" style="color: green;">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
                }
            });

            const leftoverAmount = cycleIncome - cycleTotal;  // Calculate leftover
            const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';
            const formattedStartDate = formatDate(dates.start);
            const formattedEndDate = formatDate(dates.end);

            accordionContainer.innerHTML += `
                <div class="cycle-summary">
                    <div class="cycle-info">
                        <span class="right-align">${formattedStartDate} - ${formattedEndDate}</span></div>
                    <div class="income-summary">
                        <p>Income: <span class="positive">$${cycleIncome.toFixed(2)}</span></p>
                        <p>Estimated to pay: <span class="negative">-$${cycleTotal.toFixed(2)}</span></p>
                        <p>Leftover: <span class="${leftoverClass}">$${leftoverAmount.toFixed(2)}</span></p>
                    </div>
                    <button class="accordion-btn">
                        <span>Bills list</span>
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

            const monthTotal = chartData.totals[index];
            let billsForMonth = chartData.bills[index];
            let monthIncome = chartData.incomes[index];

            // Add one-off incomes that fall within this month
            oneOffIncomes.forEach(incomeItem => {
                const incomeDate = new Date(incomeItem.date);
                const incomeMonth = incomeDate.getMonth();
                const incomeYear = incomeDate.getFullYear();

                // Check if the income falls within the current month and year
                if (incomeMonth === new Date(monthYear).getMonth() && incomeYear === new Date(monthYear).getFullYear()) {
                    monthIncome += incomeItem.amount;
                    // Format date to be consistent with the existing bill dates (e.g., "31st")
                    const formattedIncomeDate = incomeDate.getDate() + formatDaySuffix(incomeDate.getDate());
                    // Ensure positive income is displayed in green
                    billsForMonth += `<tr><td>${incomeItem.name}</td><td>${formattedIncomeDate}</td><td class="positive right-align" style="color: green;">+$${incomeItem.amount.toFixed(2)}</td></tr>`;
                }
            });

            const leftoverAmount = monthIncome - monthTotal;
            const leftoverClass = leftoverAmount >= 0 ? 'positive' : 'negative';

            accordionContainer.innerHTML += `
                <div class="cycle-summary">
                    <div class="cycle-info">
                        <span class="right-align">${monthYear}</span>
                    </div>
                    <div class="income-summary">
                        <p>Income: <span class="positive">$${monthIncome.toFixed(2)}</span></p>
                        <p>Estimated to pay: <span class="negative">-$${monthTotal.toFixed(2)}</span></p>
                        <p>Leftover: <span class="${leftoverClass}">$${leftoverAmount.toFixed(2)}</span></p>
                    </div>
                    <button class="accordion-btn">
                        <span>Bills list</span>
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
    document.querySelectorAll('.accordion-btn').forEach((button, index) => {
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

// Helper function to add the correct suffix to the date
function formatDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

// Helper function to add the correct suffix to the date
function formatDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

function sortBillsByDate(bills) {
    return bills.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB; // Sort in ascending order
    });
}


function getCycleLength(frequency) {
    let referenceDate = new Date(localStorage.getItem('payday'));

    // Check if frequency or referenceDate is invalid
    if (!frequency || isNaN(referenceDate.getTime())) {
        console.error("Invalid frequency or referenceDate passed to getCycleLength:", frequency, referenceDate);
        return 0; // Return 0 or some other appropriate default value
    }

    switch (frequency) {
        case 'weekly': 
            return 7;
        case 'fortnightly': 
            return 14;
        case 'monthly': 
            return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
        case 'quarterly': 
            return 90; // Average days in a quarter
        case 'yearly': 
            return 365;
        default: 
            console.error("Invalid frequency passed to getCycleLength:", frequency);
            return 0; // Return 0 or some other appropriate default value
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
    if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            rows += `<tr><td>${bill.name}</td><td>${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                rows += `<tr><td>${bill.name}</td><td>${formatDateWithLineBreak(billDueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            }
            billDueDate = adjustDate(getNextBillDate(billDueDate, bill.frequency));
        }
    }
    return rows;
}

function formatDateWithLineBreak(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const d = new Date(date);
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth();
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

    return `${dayOfWeek} ${day}${daySuffix} ${months[month]}<br>${year}`;
}

function getBillTotalForCycle(bill, dates) {
    let total = 0;
    let billDueDate = new Date(bill.date);

    if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
        if (billDueDate >= dates.start && billDueDate <= dates.end) {
            if (bill.amount < 0) {
                total += bill.amount; // Bills are added to the total (as they are negative)
            } else {
                total += bill.amount; // Incomes are added (as they are positive)
            }
        }
    } else {
        while (billDueDate <= dates.end) {
            if (billDueDate >= dates.start && billDueDate <= dates.end) {
                total += bill.amount; // Regular bills are added
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

    const totalMonths = 18;

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
        let billsInMonth = [];

        // Calculate income for the month based on pay dates
        payDates.forEach(payDate => {
            const payDateStartOfDay = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

            if (payDateStartOfDay >= startDate && payDateStartOfDay <= endDate) {
                monthIncome += income;
                monthPayDates.push(payDate.toDateString());
            }
        });

        // Add one-off incomes that fall within this month
        oneOffIncomes.forEach(income => {
            const incomeDate = new Date(income.date);
            if (incomeDate >= startDate && incomeDate <= endDate) {
                monthIncome += income.amount;
                monthBills += `<tr><td>${income.name}</td><td>${formatDayOnly(incomeDate)}</td><td class="positive right-align">+$${income.amount.toFixed(2)}</td></tr>`;
            }
        });

        monthlyData.incomes.push(monthIncome);
        monthlyData.payDates.push(monthPayDates);

        // Process monthly bills first
        bills.forEach(bill => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === 'monthly') {
                if (billDueDate.getDate() > endDate.getDate()) {
                    billDueDate.setDate(endDate.getDate());
                }
                billsInMonth.push({ name: bill.name, dueDate: new Date(billDueDate), amount: bill.amount });
            }
        });

        // Process weekly and fortnightly bills, showing them multiple times within the month
        bills.forEach(bill => {
            if (bill.frequency === 'weekly' || bill.frequency === 'fortnightly') {
                let billDueDate = new Date(bill.date);
                while (billDueDate <= endDate) {
                    if (billDueDate >= startDate && billDueDate <= endDate) {
                        billsInMonth.push({ name: bill.name, dueDate: new Date(billDueDate), amount: bill.amount });
                    }
                    billDueDate = getNextBillDate(billDueDate, bill.frequency);
                }
            }
        });

        // Process quarterly, yearly, and one-off bills, showing them only in the correct month
        bills.forEach(bill => {
            let billDueDate = new Date(bill.date);
            if (bill.frequency === 'quarterly') {
                if ((billDueDate.getMonth() % 3 === startDate.getMonth() % 3) &&
                    billDueDate.getFullYear() === startDate.getFullYear()) {
                    billsInMonth.push({ name: bill.name, dueDate: new Date(billDueDate), amount: bill.amount });
                }
            } else if (bill.frequency === 'yearly' || bill.frequency === 'one-off') {
                if (billDueDate.getMonth() === startDate.getMonth()) {
                    billsInMonth.push({ name: bill.name, dueDate: new Date(billDueDate), amount: bill.amount });
                }
            }
        });

        billsInMonth.sort((a, b) => a.dueDate - b.dueDate);

        billsInMonth.forEach(bill => {
            monthBills += `<tr><td>${bill.name}</td><td>${formatDayOnly(bill.dueDate)}</td><td class="bills negative right-align">-$${bill.amount.toFixed(2)}</td></tr>`;
            monthTotal += bill.amount;
        });

        monthlyData.totals.push(monthTotal);
        monthlyData.bills.push(monthBills);
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData;
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
function openModal(isEditMode = false) {
    if (!isEditMode) {
        resetBillForm();
    }
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
    if (event.target == document.getElementById('oneOffIncomeModal')) {
        closeOneOffIncomeModal();
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

function closeManageTagsModal() {
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

    closeManageTagsModal();
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const d = new Date(date);
    const dayOfWeek = days[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth();
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

    return `${dayOfWeek} ${day}${daySuffix} ${months[month]} ${year}`;
}

function formatDayOnly(date) {
    const day = date.getDate();

    let daySuffix;
    if (day > 3 && day < 21) {
        daySuffix = 'th';
    } else {
        switch (day % 10) {
            case 1:  daySuffix = "st"; break;
            case 2:  daySuffix = "nd"; break;
            case 3:  daySuffix = "rd"; break;
            default: daySuffix = "th";
        }
    }

    return `${day}${daySuffix}`;
}

function filterByTag() {
    const selectedTag = document.getElementById('tagFilter').value;
    const billsTable = document.getElementById('billsTable');
    const filteredBills = selectedTag === 'all' ? bills : bills.filter(bill => bill.tag === selectedTag);

    let totalYearlyAmount = 0;
    billsTable.innerHTML = `<thead>
                                <tr>
                                    <th onclick="sortTable('name')">Name <span id="nameSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('amount')">Amount <span id="amountSortArrow">↑</span></th>
                                    <th onclick="sortTable('frequency')">Frequency <span id="frequencySortArrow">↑</span></th>
                                    <th onclick="sortTable('date')">Due Date <span id="dateSortArrow">↑</span></th>
                                    <th onclick="sortTable('tag')">Tag <span id="tagSortArrow">↑</span></th>
                                    <th class="right-align" onclick="sortTable('totalAmount')">Yearly Total <span id="totalAmountSortArrow">↑</span></th>
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
        tags: tags,
        oneOffIncomes: oneOffIncomes
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
            tags = data.tags || ['default'];
            oneOffIncomes = data.oneOffIncomes || [];

            saveToLocalStorage();
            updateBillsTable();
            updateAccordion();
            updateTagDropdown();

            // Set dark mode if enabled
            if (darkMode) {
                document.body.classList.add('dark-mode');
                document.querySelector('.container').classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
                document.querySelector('.container').classList.remove('dark-mode');
            }

            // Update the income table after import
            if (income > 0 && payFrequency) {
                updateIncomeTable(payFrequency, income);
                // Automatically navigate to step 2
                document.getElementById('step1').classList.add('hidden');
                document.getElementById('step2').classList.remove('hidden');
            } else {
                alert("Import failed: Income or pay frequency is missing.");
            }
        };
        reader.readAsText(file);
    }
}

function autocompleteTag() {
    const tagInput = document.getElementById('billTag');
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';

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

function capitalizeFirstLetterOfSentences() {
    const elements = document.querySelectorAll('body, h1, h2, h3, h4, h5, h6, p, a, span, li, td, th, button');

    elements.forEach(element => {
        if (element.innerText) {
            element.innerText = element.innerText.toLowerCase().replace(/(^\w{1}|\.\s*\w{1})/g, match => match.toUpperCase());
        }
    });
}

document.getElementById('billTag').addEventListener('input', autocompleteTag);
