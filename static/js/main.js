// Initialize charts
let caloriesChart, nutrientsChart, micronutrientsChart, categoryChart;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupEventListeners();
    loadUserPreferences();
    updatePredictions();
    updateSeasonalInfo();
    updateNutritionStats();
    updateMealVariety();
    initializeDateInputs();
});

function initializeCharts() {
    // Calories Chart
    const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
    caloriesChart = new Chart(caloriesCtx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [{
                label: 'Daily Calories',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4CAF50',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Calorie Intake - Last 7 Days'
                }
            }
        }
    });

    // Nutrients Chart
    const nutrientsCtx = document.getElementById('nutrientsChart').getContext('2d');
    nutrientsChart = new Chart(nutrientsCtx, {
        type: 'radar',
        data: {
            labels: ['Protein', 'Carbs', 'Fiber', 'Vitamins', 'Minerals'],
            datasets: [{
                label: 'Current',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: '#2196F3',
                pointBackgroundColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Micronutrients Chart
    const micronutrientsCtx = document.getElementById('micronutrientsChart').getContext('2d');
    micronutrientsChart = new Chart(micronutrientsCtx, {
        type: 'bar',
        data: {
            labels: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Iron', 'Calcium'],
            datasets: [{
                label: 'Weekly Progress',
                data: [0, 0, 0, 0, 0],
                backgroundColor: '#FF9800'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Grain Based', 'Protein Rich', 'Fiber Rich'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function setupEventListeners() {
    // Form submission
    document.getElementById('preferencesForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserPreferences();
        updatePredictions();
    });

    // Time input changes
    ['breakfastTime', 'lunchTime', 'dinnerTime'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            saveUserPreferences();
            updatePredictions();
        });
    });

    // Nutrition target changes
    ['caloriesTarget', 'proteinTarget'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            saveUserPreferences();
            updateNutritionStats();
        });
    });

    // Add row button
    document.getElementById('addRow').addEventListener('click', addMealDataRow);
    
    // Add event button
    document.getElementById('addEvent').addEventListener('click', addEvent);
    
    // Form submission
    document.getElementById('predictionForm').addEventListener('submit', handlePredictionSubmit);
}

function saveUserPreferences() {
    const preferences = {
        dietary_type: document.getElementById('dietaryType').value,
        meal_size: document.getElementById('mealSize').value,
        allergies: document.getElementById('allergies').value.split(',').map(item => item.trim()),
        health_goals: Array.from(document.querySelectorAll('input[name="health_goals"]:checked'))
            .map(checkbox => checkbox.value),
        preferred_meals: Array.from(document.getElementById('preferredMeals').selectedOptions)
            .map(option => option.value),
        meal_times: {
            breakfast: document.getElementById('breakfastTime').value,
            lunch: document.getElementById('lunchTime').value,
            dinner: document.getElementById('dinnerTime').value
        },
        nutrition_targets: {
            calories: parseInt(document.getElementById('caloriesTarget').value),
            protein: parseInt(document.getElementById('proteinTarget').value)
        }
    };

    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    fetch('/api/update_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    });
}

function loadUserPreferences() {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Load basic preferences
        document.getElementById('dietaryType').value = preferences.dietary_type;
        document.getElementById('mealSize').value = preferences.meal_size;
        document.getElementById('allergies').value = preferences.allergies.join(', ');
        
        // Load health goals
        preferences.health_goals.forEach(goal => {
            document.querySelector(`input[value="${goal}"]`).checked = true;
        });
        
        // Load meal times
        if (preferences.meal_times) {
            document.getElementById('breakfastTime').value = preferences.meal_times.breakfast;
            document.getElementById('lunchTime').value = preferences.meal_times.lunch;
            document.getElementById('dinnerTime').value = preferences.meal_times.dinner;
        }
        
        // Load nutrition targets
        if (preferences.nutrition_targets) {
            document.getElementById('caloriesTarget').value = preferences.nutrition_targets.calories;
            document.getElementById('proteinTarget').value = preferences.nutrition_targets.protein;
        }
        
        // Load preferred meals
        if (preferences.preferred_meals) {
            const select = document.getElementById('preferredMeals');
            preferences.preferred_meals.forEach(meal => {
                Array.from(select.options).forEach(option => {
                    if (option.value === meal) option.selected = true;
                });
            });
        }
    }
}

async function updatePredictions() {
    const mealTimes = ['breakfast', 'lunch', 'dinner'];
    
    for (const mealTime of mealTimes) {
        const container = document.querySelector(`#${mealTime} .predictions-container`);
        container.innerHTML = '<div class="loading">Loading predictions...</div>';

        try {
            const response = await fetch(`/api/predict_meal?meal_time=${mealTime}`);
            const predictions = await response.json();
            
            container.innerHTML = predictions.map(pred => `
                <div class="prediction-item">
                    <div class="meal-info">
                        <h4>${pred.meal}</h4>
                        <p>Probability: ${(pred.probability * 100).toFixed(1)}%</p>
                        <div class="nutrition-info">
                            <p>Calories: ${pred.nutrition.calories} kcal</p>
                            <p>Protein: ${pred.nutrition.protein}g</p>
                            <p>Carbs: ${pred.nutrition.carbs}g</p>
                            <p>Fiber: ${pred.nutrition.fiber}g</p>
                        </div>
                        <div class="health-tags">
                            ${pred.health_tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="seasonal-info">
                        <p>Seasonal Ingredients:</p>
                        <ul>
                            ${pred.seasonal_ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to load predictions</div>';
        }
    }
}

function updateSeasonalInfo() {
    const currentDate = new Date();
    const season = getIndianSeason(currentDate);
    document.getElementById('currentSeason').textContent = `Current Season: ${season}`;
    document.getElementById('seasonDates').textContent = getSeasonDates(season);

    // Fetch seasonal data
    fetch('/api/seasonal_ingredients')
        .then(response => response.json())
        .then(data => {
            // Update ingredients
            const ingredientsGrid = document.getElementById('seasonalIngredients');
            ingredientsGrid.innerHTML = data.ingredients.map(ingredient => `
                <div class="ingredient-item">
                    <span>${ingredient}</span>
                </div>
            `).join('');

            // Update seasonal meals
            const seasonalMeals = document.getElementById('seasonalMeals');
            seasonalMeals.innerHTML = data.meals.map(meal => `
                <div class="meal-item">
                    <span>${meal.name}</span>
                    <small>${meal.description}</small>
                </div>
            `).join('');
        })
        .catch(() => {
            document.getElementById('seasonalIngredients').innerHTML = 
                '<div class="error">Failed to load seasonal information</div>';
        });
}

function updateNutritionStats() {
    fetch('/api/nutrition_stats')
        .then(response => response.json())
        .then(data => {
            // Update progress bars
            updateProgressBars(data.daily_averages);
            
            // Update charts
            updateNutritionCharts(data);
        })
        .catch(error => {
            console.error('Failed to update nutrition stats:', error);
        });
}

function updateProgressBars(dailyData) {
    const targets = {
        calories: parseInt(document.getElementById('caloriesTarget').value),
        protein: parseInt(document.getElementById('proteinTarget').value),
        carbs: 275,
        fiber: 30
    };

    Object.entries(dailyData).forEach(([nutrient, value]) => {
        const target = targets[nutrient];
        const percentage = Math.min((value / target) * 100, 100);
        const progressBar = document.querySelector(`#dailyProgress .progress-item:nth-child(${Object.keys(dailyData).indexOf(nutrient) + 1}) .progress-fill`);
        const valueSpan = document.querySelector(`#dailyProgress .progress-item:nth-child(${Object.keys(dailyData).indexOf(nutrient) + 1}) span`);
        
        progressBar.style.width = `${percentage}%`;
        valueSpan.textContent = `${value}/${target}${nutrient === 'calories' ? ' kcal' : 'g'}`;
    });
}

function updateMealVariety() {
    fetch('/api/meal_variety')
        .then(response => response.json())
        .then(data => {
            // Update category distribution chart
            categoryChart.data.datasets[0].data = [
                data.distribution.grain_based,
                data.distribution.protein_rich,
                data.distribution.fiber_rich
            ];
            categoryChart.update();

            // Update recent meals list
            const recentMeals = document.getElementById('recentMeals');
            recentMeals.innerHTML = data.recent_meals.map(meal => `
                <div class="meal-history-item">
                    <span>${meal.name}</span>
                    <small>${meal.date}</small>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Failed to update meal variety:', error);
        });
}

function getIndianSeason(date) {
    const month = date.getMonth() + 1;
    if (month in [12, 1, 2]) return 'Winter';
    if (month in [3, 4, 5]) return 'Summer';
    if (month in [6, 7, 8, 9]) return 'Monsoon';
    return 'Post-Monsoon';
}

function getSeasonDates(season) {
    const seasonDates = {
        'Winter': 'December to February',
        'Summer': 'March to May',
        'Monsoon': 'June to September',
        'Post-Monsoon': 'October to November'
    };
    return seasonDates[season];
}

function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return dates;
}

function initializeDateInputs() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = formatDate(startDate);
    document.getElementById('endDate').value = formatDate(endDate);
}

function addMealDataRow() {
    const tbody = document.getElementById('mealDataBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="date" class="meal-date" required></td>
        <td>
            <select class="meal-type" required>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
            </select>
        </td>
        <td><input type="number" class="meal-quantity" min="1" required></td>
        <td><input type="checkbox" class="is-weekend"></td>
        <td><input type="checkbox" class="is-holiday"></td>
        <td><button type="button" class="remove-row">×</button></td>
    `;
    
    // Set default date to today
    row.querySelector('.meal-date').value = formatDate(new Date());
    
    // Add remove functionality
    row.querySelector('.remove-row').addEventListener('click', () => {
        row.remove();
    });
    
    tbody.appendChild(row);
}

function addEvent() {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventImpact = document.getElementById('eventImpact').value;
    
    if (!eventName || !eventDate) {
        alert('Please fill in both event name and date');
        return;
    }
    
    const eventsList = document.getElementById('eventsList');
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event-item';
    eventDiv.innerHTML = `
        <span>${eventName} - ${formatDate(new Date(eventDate))} (${eventImpact} impact)</span>
        <button type="button" class="remove-event">×</button>
    `;
    
    eventDiv.querySelector('.remove-event').addEventListener('click', () => {
        eventDiv.remove();
    });
    
    eventsList.appendChild(eventDiv);
    
    // Clear inputs
    document.getElementById('eventName').value = '';
    document.getElementById('eventDate').value = '';
}

async function handlePredictionSubmit(e) {
    e.preventDefault();
    
    const loadingIndicator = document.querySelector('.loading-indicator');
    const resultsContainer = document.getElementById('predictionResults');
    
    loadingIndicator.style.display = 'flex';
    resultsContainer.innerHTML = '';
    
    try {
        const data = gatherFormData();
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const predictions = await response.json();
        displayPredictions(predictions);
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                Failed to generate predictions. Please try again.
            </div>
        `;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function gatherFormData() {
    // Gather meal data
    const mealData = [];
    document.querySelectorAll('#mealDataBody tr').forEach(row => {
        mealData.push({
            date: row.querySelector('.meal-date').value,
            meal_type: row.querySelector('.meal-type').value,
            quantity: parseInt(row.querySelector('.meal-quantity').value),
            is_weekend: row.querySelector('.is-weekend').checked,
            is_holiday: row.querySelector('.is-holiday').checked
        });
    });
    
    // Gather events data
    const events = [];
    document.querySelectorAll('.event-item').forEach(eventDiv => {
        const eventText = eventDiv.querySelector('span').textContent;
        const [name, dateAndImpact] = eventText.split(' - ');
        const [date, impact] = dateAndImpact.split(' (');
        events.push({
            name: name,
            date: date,
            impact: impact.replace(' impact)', '')
        });
    });
    
    // Gather selected meals
    const availableMeals = Array.from(document.getElementById('availableMeals').selectedOptions)
        .map(option => option.value);
    
    return {
        date_range: {
            start: document.getElementById('startDate').value,
            end: document.getElementById('endDate').value
        },
        meal_data: mealData,
        events: events,
        available_meals: availableMeals
    };
}

function displayPredictions(predictions) {
    const resultsContainer = document.getElementById('predictionResults');
    
    const html = predictions.map(pred => `
        <div class="prediction-card">
            <h3>${pred.meal_type}</h3>
            <div class="prediction-details">
                <p class="prediction-quantity">Predicted Quantity: ${pred.predicted_quantity}</p>
                <p class="confidence">Confidence: ${(pred.confidence * 100).toFixed(1)}%</p>
                <div class="recommended-meals">
                    <h4>Recommended Meals:</h4>
                    <ul>
                        ${pred.recommended_meals.map(meal => `
                            <li>${meal.name} (${(meal.probability * 100).toFixed(1)}%)</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Update data every 30 minutes
setInterval(() => {
    updatePredictions();
    updateSeasonalInfo();
    updateNutritionStats();
    updateMealVariety();
}, 30 * 60 * 1000); 