class MealPredictor {
    constructor() {
        this.historicalData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePredictions();
    }

    setupEventListeners() {
        const form = document.getElementById('historicalDataForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.predictMeals();
            });
        }

        document.querySelectorAll('.use-suggestion').forEach(button => {
            button.addEventListener('click', (e) => {
                const card = e.target.closest('.prediction-card');
                const mealName = card.querySelector('.meal-suggestion h4').textContent;
                this.useSuggestion(mealName);
            });
        });
    }

    useSuggestion(mealName) {
        // Add to meal plan
        console.log(`Adding ${mealName} to meal plan`);
        
        // Show success notification
        this.showNotification(`Added ${mealName} to your meal plan! (+15 Karma)`);
        
        // Update karma score
        this.updateKarmaScore(15);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        container.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    updateKarmaScore(points) {
        const karmaDisplay = document.querySelector('.karma-display span');
        const currentKarma = parseInt(karmaDisplay.textContent);
        karmaDisplay.textContent = `${currentKarma + points} Karma`;

        const karmaScore = document.querySelector('.karma-score');
        if (karmaScore) {
            karmaScore.textContent = currentKarma + points;
        }
    }

    updatePredictions() {
        // In a real application, this would fetch predictions from the backend
        // For now, we'll just update the confidence numbers periodically
        setInterval(() => {
            document.querySelectorAll('.confidence').forEach(conf => {
                const currentConf = parseInt(conf.textContent);
                const newConf = Math.max(80, Math.min(99, currentConf + (Math.random() > 0.5 ? 1 : -1)));
                conf.textContent = `${newConf}% confident`;
            });
        }, 30000); // Update every 30 seconds
    }

    async predictMeals() {
        const historicalDataText = document.getElementById('historicalData').value;
        const inventory = storage.get('inventory') || [];
        
        // Get expiring items (within 7 days)
        const expiringItems = this.getExpiringItems(inventory);
        
        // Update expiring items alert
        this.updateExpiringItemsAlert(expiringItems);
        
        // Generate meal suggestions based on expiring items and historical data
        const suggestedMeals = this.generateMealSuggestions(expiringItems, inventory, historicalDataText);
        
        // Calculate total possible meals today
        const totalPossibleMeals = this.calculateTotalPossibleMeals(suggestedMeals);
        
        // Display results
        this.displayResults(suggestedMeals, totalPossibleMeals);
    }

    calculateTotalPossibleMeals(suggestedMeals) {
        // Sum up all servings from suggested meals
        const totalServings = suggestedMeals.reduce((total, meal) => total + meal.servings, 0);
        
        // Get historical average
        const patterns = this.analyzeHistoricalData(document.getElementById('historicalData').value);
        
        return {
            possible: totalServings,
            recommended: patterns.averageMeals,
            status: totalServings >= patterns.averageMeals ? 'good' : 'warning'
        };
    }

    getExpiringItems(inventory) {
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        return inventory
            .filter(item => {
                const expiryDate = new Date(item.expiryDate);
                return expiryDate <= sevenDaysFromNow;
            })
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    }

    updateExpiringItemsAlert(expiringItems) {
        const alertDiv = document.getElementById('expiringItemsAlert');
        const listDiv = document.getElementById('expiringItemsList');
        
        if (expiringItems.length > 0) {
            listDiv.innerHTML = expiringItems.map(item => {
                const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return `
                    <div class="meal-item">
                        <div>
                            <div class="meal-name">${item.name}</div>
                            <div class="meal-ingredients">Expires in ${daysUntilExpiry} days</div>
                        </div>
                        <span class="meal-priority priority-${daysUntilExpiry <= 3 ? 'high' : 'medium'}">
                            ${daysUntilExpiry <= 3 ? 'Use ASAP' : 'Use Soon'}
                        </span>
                    </div>
                `;
            }).join('');
            alertDiv.style.display = 'block';
        } else {
            alertDiv.style.display = 'none';
        }
    }

    generateMealSuggestions(expiringItems, inventory, historicalData) {
        // Parse historical data to understand patterns
        const patterns = this.analyzeHistoricalData(historicalData);
        
        // Generate meal suggestions prioritizing expiring items
        const suggestions = [];
        
        // First, suggest meals using expiring items
        for (const item of expiringItems) {
            const suggestion = this.createMealSuggestion(item, inventory, patterns);
            if (suggestion) {
                suggestions.push({
                    ...suggestion,
                    priority: 'high'
                });
            }
        }
        
        // Then, suggest additional meals based on inventory and patterns
        const regularItems = inventory.filter(item => 
            !expiringItems.find(expiring => expiring.id === item.id)
        );
        
        for (const item of regularItems) {
            const suggestion = this.createMealSuggestion(item, inventory, patterns);
            if (suggestion) {
                suggestions.push({
                    ...suggestion,
                    priority: 'low'
                });
            }
        }
        
        return suggestions;
    }

    analyzeHistoricalData(historicalData) {
        // Simple pattern analysis from historical data
        const lines = historicalData.split('\n');
        const patterns = {
            averageMeals: 0,
            specialEvents: []
        };
        
        let totalMeals = 0;
        let mealCounts = 0;
        
        lines.forEach(line => {
            const mealsMatch = line.match(/(\d+)\s*meals/);
            if (mealsMatch) {
                totalMeals += parseInt(mealsMatch[1]);
                mealCounts++;
            }
            
            if (line.toLowerCase().includes('special event')) {
                patterns.specialEvents.push(line);
            }
        });
        
        patterns.averageMeals = mealCounts > 0 ? Math.round(totalMeals / mealCounts) : 50;
        return patterns;
    }

    createMealSuggestion(mainItem, inventory, patterns) {
        // Simple meal suggestion logic
        const complementaryItems = this.findComplementaryItems(mainItem, inventory);
        
        return {
            name: this.generateMealName(mainItem, complementaryItems),
            ingredients: [mainItem, ...complementaryItems],
            servings: Math.min(patterns.averageMeals, this.calculatePossibleServings(mainItem, complementaryItems))
        };
    }

    findComplementaryItems(mainItem, inventory) {
        // Simple logic to find items that go well together
        return inventory
            .filter(item => item.id !== mainItem.id)
            .slice(0, 2); // Limit to 2 complementary items for simplicity
    }

    generateMealName(mainItem, complementaryItems) {
        if (complementaryItems.length === 0) {
            return `${mainItem.name} Special`;
        }
        return `${mainItem.name} with ${complementaryItems.map(item => item.name).join(' & ')}`;
    }

    calculatePossibleServings(mainItem, complementaryItems) {
        // Simple serving calculation based on quantity
        // This could be made more sophisticated based on actual quantity units
        const quantities = [mainItem, ...complementaryItems].map(item => {
            const num = parseInt(item.quantity);
            return isNaN(num) ? 1 : num;
        });
        return Math.min(...quantities) * 2; // Assuming each item can serve 2 people
    }

    displayResults(suggestedMeals, totalPossibleMeals) {
        const resultsDiv = document.getElementById('predictionResults');
        const suggestedDiv = document.getElementById('suggestedMeals');
        const mealsListDiv = document.getElementById('mealsList');
        
        if (suggestedMeals.length > 0) {
            // First, display the total meals summary
            resultsDiv.innerHTML = `
                <div class="meals-summary ${totalPossibleMeals.status}">
                    <div class="summary-content">
                        <div class="summary-numbers">
                            <div class="total-meals">
                                <span class="number">${totalPossibleMeals.possible}</span>
                                <span class="label">Possible Meals Today</span>
                            </div>
                            <div class="recommended-meals">
                                <span class="number">${totalPossibleMeals.recommended}</span>
                                <span class="label">Recommended (based on history)</span>
                            </div>
                        </div>
                        <div class="summary-status">
                            ${this.generateStatusMessage(totalPossibleMeals)}
                        </div>
                    </div>
                </div>
            `;

            // Then display the meal suggestions
            mealsListDiv.innerHTML = suggestedMeals.map(meal => `
                <div class="meal-item">
                    <div>
                        <div class="meal-name">${meal.name}</div>
                        <div class="meal-ingredients">
                            Serves ${meal.servings} | Ingredients: ${meal.ingredients.map(i => i.name).join(', ')}
                        </div>
                    </div>
                    <span class="meal-priority priority-${meal.priority}">
                        ${meal.priority === 'high' ? 'Priority' : 'Suggested'}
                    </span>
                </div>
            `).join('');
            suggestedDiv.style.display = 'block';
        } else {
            resultsDiv.innerHTML = `
                <div class="empty-prediction">
                    <i class="fas fa-lightbulb"></i>
                    <p>Enter historical data and click "Predict Meals Needed" to see the forecast here.</p>
                </div>
            `;
        }
    }

    generateStatusMessage(totalPossibleMeals) {
        const { possible, recommended, status } = totalPossibleMeals;
        
        if (status === 'good') {
            if (possible > recommended * 1.2) {
                return `<i class="fas fa-check-circle"></i> You can prepare more meals than typically needed!`;
            }
            return `<i class="fas fa-check-circle"></i> You have enough ingredients for today's meals.`;
        } else {
            const deficit = recommended - possible;
            return `<i class="fas fa-exclamation-triangle"></i> You may need ingredients for ${deficit} more meals based on historical needs.`;
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mealPredictor = new MealPredictor();
}); 