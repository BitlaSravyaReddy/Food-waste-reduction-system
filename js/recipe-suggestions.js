// Recipe Suggestion System
class RecipeSuggestionSystem {
    constructor() {
        this.recipes = [
            {
                id: 1,
                title: "Vegetable Stir Fry",
                image: "images/recipes/stir-fry.jpg",
                prepTime: 15,
                cookTime: 15,
                difficulty: "Easy",
                category: "dinner",
                dietType: "vegetarian",
                ingredients: [
                    { name: "carrots", amount: "2", unit: "medium", category: "vegetables" },
                    { name: "broccoli", amount: "1", unit: "head", category: "vegetables" },
                    { name: "bell peppers", amount: "2", unit: "medium", category: "vegetables" },
                    { name: "soy sauce", amount: "3", unit: "tbsp", category: "condiments" },
                    { name: "garlic", amount: "3", unit: "cloves", category: "vegetables" }
                ],
                instructions: [
                    "Wash and chop all vegetables into bite-sized pieces",
                    "Heat oil in a large wok over medium-high heat",
                    "Add garlic and stir-fry for 30 seconds",
                    "Add vegetables, starting with the firmest ones",
                    "Add soy sauce and stir-fry until vegetables are tender-crisp"
                ]
            },
            {
                id: 2,
                title: "Quick Fruit Smoothie Bowl",
                image: "images/recipes/smoothie-bowl.jpg",
                prepTime: 10,
                cookTime: 0,
                difficulty: "Easy",
                category: "breakfast",
                dietType: "vegan",
                ingredients: [
                    { name: "banana", amount: "1", unit: "large", category: "fruits" },
                    { name: "berries", amount: "1", unit: "cup", category: "fruits" },
                    { name: "yogurt", amount: "1", unit: "cup", category: "dairy" },
                    { name: "honey", amount: "1", unit: "tbsp", category: "condiments" },
                    { name: "granola", amount: "1/4", unit: "cup", category: "grains" }
                ],
                instructions: [
                    "Blend frozen fruits with yogurt until smooth",
                    "Pour into a bowl",
                    "Top with fresh fruits and granola",
                    "Drizzle with honey"
                ]
            },
            // Add more recipe templates here
        ];
        this.init();
    }

    init() {
        this.loadInventory();
        this.setupEventListeners();
        this.updateSuggestions();
    }

    loadInventory() {
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    }

    setupEventListeners() {
        // Update suggestions when inventory changes
        window.addEventListener('inventoryUpdated', () => {
            this.loadInventory();
            this.updateSuggestions();
        });

        // Filter buttons
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateSuggestions(btn.dataset.category);
            });
        });

        // Search input
        const searchInput = document.getElementById('recipe-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.updateSuggestions();
            }, 300));
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    calculateRecipeScore(recipe) {
        const availableIngredients = recipe.ingredients.filter(ingredient =>
            this.inventory.some(item => 
                item.name.toLowerCase().includes(ingredient.name.toLowerCase())
            )
        );

        const score = {
            matchPercentage: (availableIngredients.length / recipe.ingredients.length) * 100,
            hasExpiringItems: this.hasExpiringIngredients(recipe),
            totalTime: recipe.prepTime + recipe.cookTime
        };

        // Weighted score calculation
        return (
            (score.matchPercentage * 0.6) + // 60% weight for ingredient matches
            (score.hasExpiringItems ? 30 : 0) + // 30% boost for using expiring items
            (score.totalTime < 30 ? 10 : 0) // 10% boost for quick recipes
        );
    }

    hasExpiringIngredients(recipe) {
        const expiringItems = this.inventory.filter(item => this.isExpiringSoon(item));
        return recipe.ingredients.some(ingredient =>
            expiringItems.some(item =>
                item.name.toLowerCase().includes(ingredient.name.toLowerCase())
            )
        );
    }

    isExpiringSoon(item) {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    }

    updateSuggestions(category = 'all') {
        const searchQuery = document.getElementById('recipe-search')?.value.toLowerCase() || '';
        const timeFilter = document.getElementById('time-filter')?.value || 'all';
        const difficultyFilter = document.getElementById('difficulty-filter')?.value || 'all';
        const dietFilter = document.getElementById('diet-filter')?.value || 'all';

        let filteredRecipes = this.recipes
            .filter(recipe => {
                const matchesCategory = category === 'all' || recipe.category === category;
                const matchesSearch = recipe.title.toLowerCase().includes(searchQuery);
                const matchesTime = timeFilter === 'all' || (recipe.prepTime + recipe.cookTime) <= parseInt(timeFilter);
                const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty.toLowerCase() === difficultyFilter;
                const matchesDiet = dietFilter === 'all' || recipe.dietType === dietFilter;

                return matchesCategory && matchesSearch && matchesTime && matchesDifficulty && matchesDiet;
            })
            .map(recipe => ({
                ...recipe,
                score: this.calculateRecipeScore(recipe)
            }))
            .sort((a, b) => b.score - a.score);

        this.displayRecipes(filteredRecipes);
    }

    displayRecipes(recipes) {
        const recipesGrid = document.querySelector('.recipes-grid');
        if (!recipesGrid) return;

        recipesGrid.innerHTML = recipes.length ? 
            recipes.map(recipe => this.createRecipeCard(recipe)).join('') :
            '<p class="no-recipes">No recipes match your current filters</p>';

        // Add click listeners to recipe cards
        recipesGrid.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = parseInt(card.dataset.recipeId);
                this.showRecipeDetails(recipeId);
            });
        });
    }

    createRecipeCard(recipe) {
        const availableIngredients = recipe.ingredients.filter(ingredient =>
            this.inventory.some(item =>
                item.name.toLowerCase().includes(ingredient.name.toLowerCase())
            )
        );

        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <div><i class="fas fa-clock"></i> ${recipe.prepTime + recipe.cookTime} mins</div>
                        <div><i class="fas fa-utensils"></i> ${recipe.difficulty}</div>
                    </div>
                    <div class="recipe-tags">
                        <span class="recipe-tag available">
                            ${availableIngredients.length}/${recipe.ingredients.length} ingredients
                        </span>
                        ${this.hasExpiringIngredients(recipe) ?
                            '<span class="recipe-tag expiring">Uses expiring items</span>' : ''}
                        <span class="recipe-tag diet">${recipe.dietType}</span>
                        ${recipe.prepTime + recipe.cookTime <= 30 ?
                            '<span class="recipe-tag time">Quick</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    showRecipeDetails(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const modal = document.querySelector('.recipe-details-modal');
        const detailsContainer = modal.querySelector('.recipe-details');

        detailsContainer.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-details-image">
            <div class="recipe-details-content">
                <h2 class="recipe-details-title">${recipe.title}</h2>
                <div class="recipe-details-meta">
                    <div><i class="fas fa-clock"></i> Prep: ${recipe.prepTime} mins</div>
                    <div><i class="fas fa-fire"></i> Cook: ${recipe.cookTime} mins</div>
                    <div><i class="fas fa-utensils"></i> ${recipe.difficulty}</div>
                </div>
                
                <div class="recipe-section">
                    <h3>Ingredients</h3>
                    <div class="ingredients-list">
                        ${recipe.ingredients.map(ingredient => `
                            <div class="ingredient-item ${this.isIngredientAvailable(ingredient) ? 'available' : ''}">
                                <i class="fas fa-${this.isIngredientAvailable(ingredient) ? 'check' : 'times'}"></i>
                                <span class="ingredient-amount">${ingredient.amount} ${ingredient.unit}</span>
                                <span>${ingredient.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="recipe-section">
                    <h3>Instructions</h3>
                    <div class="instructions-list">
                        ${recipe.instructions.map((step, index) => `
                            <div class="instruction-step">
                                <div class="step-number">${index + 1}</div>
                                <div>${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    isIngredientAvailable(ingredient) {
        return this.inventory.some(item =>
            item.name.toLowerCase().includes(ingredient.name.toLowerCase())
        );
    }
}

// Initialize recipe suggestion system when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.recipeSuggestions = new RecipeSuggestionSystem();
}); 