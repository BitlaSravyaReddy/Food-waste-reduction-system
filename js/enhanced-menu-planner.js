class EnhancedMenuPlanner {
    constructor() {
        this.inventory = [];
        this.recipes = [];
        this.mealPlan = [];
        this.filters = {
            mealType: 'all',
            dietaryRestrictions: [],
            maxPrepTime: null,
            useExpiringFirst: true
        };
        this.init();
    }

    async init() {
        await this.loadInventory();
        await this.loadRecipes();
        this.setupEventListeners();
        this.generateWeeklyPlan();
    }

    async loadInventory() {
        try {
            const inventoryData = JSON.parse(localStorage.getItem('inventory')) || [];
            this.inventory = inventoryData.map(item => ({
                ...item,
                expiryDate: new Date(item.expiryDate),
                quantity: parseFloat(item.quantity)
            }));
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.inventory = [];
        }
    }

    async loadRecipes() {
        // In a real app, this would fetch from an API
        this.recipes = [
            {
                id: 'cereal-breakfast',
                name: 'Cereal with Milk and Fruit',
                type: 'breakfast',
                cuisine: 'International',
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                difficulty: 'Easy',
                dietaryInfo: ['vegetarian'],
                ingredients: [
                    { name: 'cereal', amount: 1, unit: 'cup', category: 'grains' },
                    { name: 'milk', amount: 1, unit: 'cup', category: 'dairy' },
                    { name: 'banana', amount: 1, unit: 'medium', category: 'fruits' },
                    { name: 'strawberries', amount: 4, unit: 'medium', category: 'fruits' }
                ],
                instructions: [
                    'Pour cereal into a bowl',
                    'Add cold milk',
                    'Slice banana and strawberries',
                    'Top with fresh fruit'
                ]
            },
            {
                id: 'fruit-smoothie',
                name: 'Fruit Smoothie',
                type: 'breakfast',
                cuisine: 'International',
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                difficulty: 'Easy',
                dietaryInfo: ['vegetarian'],
                ingredients: [
                    { name: 'banana', amount: 1, unit: 'large', category: 'fruits' },
                    { name: 'strawberries', amount: 1, unit: 'cup', category: 'fruits' },
                    { name: 'yogurt', amount: 1, unit: 'cup', category: 'dairy' },
                    { name: 'honey', amount: 1, unit: 'tbsp', category: 'condiments' },
                    { name: 'milk', amount: 0.5, unit: 'cup', category: 'dairy' }
                ],
                instructions: [
                    'Add all ingredients to blender',
                    'Blend until smooth',
                    'Add more milk if needed for desired consistency',
                    'Pour into glasses and serve immediately'
                ]
            },
            {
                id: 'apple-spinach-skewers',
                name: 'Apple and Spinach Skewers',
                type: 'breakfast',
                cuisine: 'Modern',
                prepTime: 10,
                cookTime: 0,
                servings: 2,
                difficulty: 'Easy',
                dietaryInfo: ['vegetarian', 'vegan'],
                ingredients: [
                    { name: 'apples', amount: 2, unit: 'medium', category: 'fruits' },
                    { name: 'spinach', amount: 2, unit: 'cups', category: 'vegetables' },
                    { name: 'lemon juice', amount: 1, unit: 'tbsp', category: 'condiments' },
                    { name: 'honey', amount: 1, unit: 'tbsp', category: 'condiments' }
                ],
                instructions: [
                    'Cut apples into bite-sized chunks',
                    'Toss apple chunks with lemon juice to prevent browning',
                    'Thread apple chunks and spinach leaves onto skewers',
                    'Drizzle with honey before serving'
                ]
            },
            {
                id: 'yogurt-parfait',
                name: 'Fruit and Yogurt Parfait',
                type: 'breakfast',
                cuisine: 'International',
                prepTime: 10,
                cookTime: 0,
                servings: 2,
                difficulty: 'Easy',
                dietaryInfo: ['vegetarian'],
                ingredients: [
                    { name: 'yogurt', amount: 2, unit: 'cups', category: 'dairy' },
                    { name: 'granola', amount: 1, unit: 'cup', category: 'grains' },
                    { name: 'honey', amount: 2, unit: 'tbsp', category: 'condiments' },
                    { name: 'strawberries', amount: 1, unit: 'cup', category: 'fruits' },
                    { name: 'blueberries', amount: 1, unit: 'cup', category: 'fruits' }
                ],
                instructions: [
                    'Layer yogurt in serving glasses',
                    'Add a layer of mixed berries',
                    'Sprinkle granola on top',
                    'Drizzle with honey',
                    'Repeat layers until glass is full'
                ]
            },
            {
                id: 'stir-fry',
                name: 'Vegetable Stir Fry',
                type: 'dinner',
                cuisine: 'Asian',
                prepTime: 15,
                cookTime: 15,
                servings: 4,
                difficulty: 'Easy',
                dietaryInfo: ['vegetarian'],
                ingredients: [
                    { name: 'carrots', amount: 2, unit: 'medium', category: 'vegetables' },
                    { name: 'broccoli', amount: 1, unit: 'head', category: 'vegetables' },
                    { name: 'bell peppers', amount: 2, unit: 'medium', category: 'vegetables' },
                    { name: 'garlic', amount: 3, unit: 'cloves', category: 'vegetables' },
                    { name: 'soy sauce', amount: 3, unit: 'tbsp', category: 'condiments' }
                ],
                instructions: [
                    'Wash and chop all vegetables',
                    'Heat oil in wok',
                    'Add garlic and stir-fry',
                    'Add vegetables in order of cooking time',
                    'Season with soy sauce'
                ]
            }
        ];
    }

    setupEventListeners() {
        document.getElementById('generatePlan').addEventListener('click', () => this.generateWeeklyPlan());
        document.getElementById('mealTypeFilter').addEventListener('change', (e) => {
            this.filters.mealType = e.target.value;
            this.updateRecipeDisplay();
        });
        document.getElementById('maxPrepTime').addEventListener('input', (e) => {
            this.filters.maxPrepTime = parseInt(e.target.value) || null;
            this.updateRecipeDisplay();
        });
        document.getElementById('useExpiringFirst').addEventListener('change', (e) => {
            this.filters.useExpiringFirst = e.target.checked;
            this.updateRecipeDisplay();
        });
    }

    calculateRecipeScore(recipe) {
        let score = 0;
        
        // Calculate available ingredients score (40%)
        const availableIngredients = recipe.ingredients.filter(ingredient =>
            this.hasIngredient(ingredient)
        );
        score += (availableIngredients.length / recipe.ingredients.length) * 40;

        // Add points for using expiring ingredients (30%)
        const expiringIngredientsUsed = recipe.ingredients.filter(ingredient =>
            this.hasExpiringIngredient(ingredient)
        ).length;
        score += (expiringIngredientsUsed / recipe.ingredients.length) * 30;

        // Quick preparation bonus (20%)
        if (recipe.prepTime + recipe.cookTime <= 30) {
            score += 20;
        } else {
            score += 20 * (60 / (recipe.prepTime + recipe.cookTime));
        }

        // Variety bonus (10%)
        const uniqueCategories = new Set(recipe.ingredients.map(i => i.category)).size;
        score += (uniqueCategories / 5) * 10; // Assuming 5 is max categories

        return score;
    }

    hasIngredient(recipeIngredient) {
        return this.inventory.some(item => 
            item.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) &&
            item.quantity >= recipeIngredient.amount
        );
    }

    hasExpiringIngredient(recipeIngredient) {
        return this.inventory.some(item => 
            item.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) &&
            this.isExpiringSoon(item)
        );
    }

    isExpiringSoon(item) {
        const daysUntilExpiry = Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    }

    generateWeeklyPlan() {
        this.mealPlan = [];
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        daysOfWeek.forEach(day => {
            const dayPlan = {
                day,
                meals: {
                    breakfast: this.suggestMeal('breakfast'),
                    lunch: this.suggestMeal('lunch'),
                    dinner: this.suggestMeal('dinner')
                }
            };
            this.mealPlan.push(dayPlan);
        });

        this.displayWeeklyPlan();
    }

    suggestMeal(mealType) {
        const eligibleRecipes = this.recipes
            .filter(recipe => {
                if (this.filters.mealType !== 'all' && recipe.type !== this.filters.mealType) return false;
                if (this.filters.maxPrepTime && (recipe.prepTime + recipe.cookTime) > this.filters.maxPrepTime) return false;
                return true;
            })
            .map(recipe => ({
                ...recipe,
                score: this.calculateRecipeScore(recipe)
            }))
            .sort((a, b) => b.score - a.score);

        return eligibleRecipes[0] || null;
    }

    displayWeeklyPlan() {
        const container = document.getElementById('weeklyPlanContainer');
        container.innerHTML = this.mealPlan.map(dayPlan => `
            <div class="day-plan-card">
                <h3>${dayPlan.day}</h3>
                <div class="meals-container">
                    ${Object.entries(dayPlan.meals).map(([type, meal]) => `
                        <div class="meal-slot">
                            <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                            ${meal ? this.createMealCard(meal) : '<p>No suggestion available</p>'}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    createMealCard(meal) {
        const availableIngredients = meal.ingredients.filter(ingredient => this.hasIngredient(ingredient));
        const expiringIngredients = meal.ingredients.filter(ingredient => this.hasExpiringIngredient(ingredient));
        
        return `
            <div class="meal-card">
                <h5>${meal.name}</h5>
                <div class="meal-meta">
                    <span><i class="fas fa-clock"></i> ${meal.prepTime + meal.cookTime} mins</span>
                    <span><i class="fas fa-utensils"></i> ${meal.difficulty}</span>
                </div>
                <div class="ingredients-status">
                    <div class="ingredient-tag">
                        <i class="fas fa-check"></i> ${availableIngredients.length}/${meal.ingredients.length}
                    </div>
                    ${expiringIngredients.length ? `
                        <div class="ingredient-tag expiring">
                            <i class="fas fa-exclamation-triangle"></i> ${expiringIngredients.length} expiring
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
} 