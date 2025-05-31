// Menu Planning System
class MenuPlanner {
    constructor() {
        this.inventory = [];
        this.recipes = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadInventory();
        this.loadRecipes();
        this.setupEventListeners();
        this.updateInventoryDisplay();
    }

    // Load inventory from localStorage or inventory system
    loadInventory() {
        // This should integrate with your existing inventory system
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        this.categorizeInventory();
    }

    // Categorize inventory items
    categorizeInventory() {
        this.categorizedInventory = {
            vegetables: this.inventory.filter(item => item.category === 'vegetables'),
            fruits: this.inventory.filter(item => item.category === 'fruits'),
            proteins: this.inventory.filter(item => item.category === 'proteins'),
            grains: this.inventory.filter(item => item.category === 'grains'),
            dairy: this.inventory.filter(item => item.category === 'dairy')
        };
    }

    // Load recipe database
    loadRecipes() {
        // This would typically come from an API or database
        this.recipes = [
            {
                id: 1,
                title: "Vegetable Stir Fry",
                image: "path/to/stirfry.jpg",
                prepTime: "20 mins",
                cookTime: "15 mins",
                difficulty: "Easy",
                type: "vegetarian",
                ingredients: [
                    { name: "carrots", amount: "2", category: "vegetables" },
                    { name: "broccoli", amount: "1 head", category: "vegetables" },
                    { name: "soy sauce", amount: "2 tbsp", category: "condiments" }
                ],
                instructions: [
                    "Chop all vegetables",
                    "Heat oil in wok",
                    "Stir fry vegetables until tender",
                    "Add soy sauce and serve"
                ]
            },
            {
                id: 2,
                title: "Fruit Smoothie Bowl",
                image: "path/to/smoothiebowl.jpg",
                prepTime: "10 mins",
                cookTime: "0 mins",
                difficulty: "Easy",
                type: "vegetarian",
                ingredients: [
                    { name: "banana", amount: "1", category: "fruits" },
                    { name: "mixed berries", amount: "1 cup", category: "fruits" },
                    { name: "yogurt", amount: "1 cup", category: "dairy" },
                    { name: "honey", amount: "1 tbsp", category: "condiments" },
                    { name: "granola", amount: "1/4 cup", category: "grains" }
                ],
                instructions: [
                    "Blend fruits with yogurt",
                    "Pour into bowl",
                    "Top with granola and honey",
                    "Serve immediately"
                ]
            },
            {
                id: 3,
                title: "Leftover Rice Frittata",
                image: "path/to/frittata.jpg",
                prepTime: "15 mins",
                cookTime: "20 mins",
                difficulty: "Medium",
                type: "vegetarian",
                ingredients: [
                    { name: "cooked rice", amount: "2 cups", category: "grains" },
                    { name: "eggs", amount: "4", category: "proteins" },
                    { name: "spinach", amount: "2 cups", category: "vegetables" },
                    { name: "cheese", amount: "1/2 cup", category: "dairy" },
                    { name: "onion", amount: "1", category: "vegetables" }
                ],
                instructions: [
                    "Beat eggs in a bowl",
                    "Mix in rice and chopped vegetables",
                    "Pour into pan and top with cheese",
                    "Bake until set"
                ]
            },
            {
                id: 4,
                title: "Quick Veggie Soup",
                image: "path/to/soup.jpg",
                prepTime: "15 mins",
                cookTime: "25 mins",
                difficulty: "Easy",
                type: "vegetarian",
                ingredients: [
                    { name: "mixed vegetables", amount: "4 cups", category: "vegetables" },
                    { name: "vegetable broth", amount: "6 cups", category: "condiments" },
                    { name: "garlic", amount: "3 cloves", category: "vegetables" },
                    { name: "herbs", amount: "1 tbsp", category: "condiments" }
                ],
                instructions: [
                    "Chop vegetables into bite-sized pieces",
                    "Sauté garlic in pot",
                    "Add vegetables and broth",
                    "Simmer until vegetables are tender",
                    "Season with herbs"
                ]
            },
            {
                id: 5,
                title: "Overripe Banana Bread",
                image: "path/to/bananabread.jpg",
                prepTime: "15 mins",
                cookTime: "45 mins",
                difficulty: "Medium",
                type: "vegetarian",
                ingredients: [
                    { name: "overripe bananas", amount: "3", category: "fruits" },
                    { name: "flour", amount: "2 cups", category: "grains" },
                    { name: "eggs", amount: "2", category: "proteins" },
                    { name: "butter", amount: "1/2 cup", category: "dairy" },
                    { name: "sugar", amount: "3/4 cup", category: "condiments" }
                ],
                instructions: [
                    "Mash bananas in a bowl",
                    "Mix with melted butter and eggs",
                    "Fold in flour and sugar",
                    "Bake in loaf pan until done"
                ]
            }
        ];
    }

    // Set up event listeners
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.updateFilterButtons();
                this.updateRecipeDisplay();
            });
        });

        // Recipe card clicks
        document.querySelector('.recipes-grid').addEventListener('click', (e) => {
            const recipeCard = e.target.closest('.recipe-card');
            if (recipeCard) {
                const recipeId = parseInt(recipeCard.dataset.recipeId);
                this.showRecipeDetails(recipeId);
            }
        });

        // Modal close button
        document.querySelector('.recipe-modal .close').addEventListener('click', () => {
            document.querySelector('.recipe-modal').classList.remove('show');
        });
    }

    // Update inventory display
    updateInventoryDisplay() {
        // Update category counts
        Object.entries(this.categorizedInventory).forEach(([category, items]) => {
            const countElement = document.querySelector(`.category[data-category="${category}"] .count`);
            if (countElement) {
                countElement.textContent = items.length;
            }
        });

        // Update expiring items
        const expiringItems = this.inventory
            .filter(item => this.isExpiringSoon(item))
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        const expiringList = document.querySelector('.expiring-items-list');
        expiringList.innerHTML = expiringItems.length ? 
            expiringItems.map(item => this.createExpiringItemHTML(item)).join('') :
            '<p>No items expiring soon</p>';
    }

    // Check if item is expiring soon (within 3 days)
    isExpiringSoon(item) {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    }

    // Create HTML for expiring item
    createExpiringItemHTML(item) {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <div class="expiring-item">
                <span>${item.name}</span>
                <span class="days">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left</span>
            </div>
        `;
    }

    // Update recipe display based on current filter and inventory
    updateRecipeDisplay() {
        const recipesGrid = document.querySelector('.recipes-grid');
        const filteredRecipes = this.filterRecipes();
        
        recipesGrid.innerHTML = filteredRecipes.length ?
            filteredRecipes.map(recipe => this.createRecipeCardHTML(recipe)).join('') :
            '<p class="no-recipes">No recipes match your current filters</p>';
    }

    // Filter recipes based on current filter and inventory
    filterRecipes() {
        return this.recipes.filter(recipe => {
            if (this.currentFilter === 'quick') {
                return parseInt(recipe.prepTime) + parseInt(recipe.cookTime) <= 30;
            }
            if (this.currentFilter === 'expiring') {
                return this.hasExpiringIngredients(recipe);
            }
            if (this.currentFilter === 'vegetarian') {
                return recipe.type === 'vegetarian';
            }
            return true;
        }).sort((a, b) => {
            // Prioritize recipes with more available ingredients
            return this.getAvailableIngredientsCount(b) - this.getAvailableIngredientsCount(a);
        });
    }

    // Check if recipe uses expiring ingredients
    hasExpiringIngredients(recipe) {
        const expiringItems = this.inventory.filter(item => this.isExpiringSoon(item));
        return recipe.ingredients.some(ingredient => 
            expiringItems.some(item => 
                item.name.toLowerCase().includes(ingredient.name.toLowerCase())
            )
        );
    }

    // Get count of available ingredients for a recipe
    getAvailableIngredientsCount(recipe) {
        return recipe.ingredients.filter(ingredient =>
            this.inventory.some(item =>
                item.name.toLowerCase().includes(ingredient.name.toLowerCase())
            )
        ).length;
    }

    // Create HTML for recipe card
    createRecipeCardHTML(recipe) {
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
                    <div class="recipe-ingredients">
                        <span class="ingredient-tag available">
                            ${availableIngredients.length}/${recipe.ingredients.length} ingredients
                        </span>
                        ${this.hasExpiringIngredients(recipe) ?
                            '<span class="ingredient-tag expiring">Uses expiring items</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Show recipe details in modal
    showRecipeDetails(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const modal = document.querySelector('.recipe-modal');
        const detailsContainer = modal.querySelector('.recipe-details');

        detailsContainer.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="recipe-details-image">
            <div class="recipe-details-content">
                <h2 class="recipe-details-title">${recipe.title}</h2>
                <div class="recipe-details-meta">
                    <div><i class="fas fa-clock"></i> Prep: ${recipe.prepTime}</div>
                    <div><i class="fas fa-fire"></i> Cook: ${recipe.cookTime}</div>
                    <div><i class="fas fa-utensils"></i> ${recipe.difficulty}</div>
                </div>
                
                <div class="recipe-ingredients-list">
                    <h3>Ingredients</h3>
                    ${recipe.ingredients.map(ingredient => `
                        <div class="ingredient-item">
                            <i class="fas fa-${this.isIngredientAvailable(ingredient) ? 'check' : 'times'}"></i>
                            <span>${ingredient.amount} ${ingredient.name}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="recipe-instructions">
                    <h3>Instructions</h3>
                    ${recipe.instructions.map((step, index) => `
                        <div class="instruction-step">
                            <div class="step-number">${index + 1}</div>
                            <div>${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    // Check if ingredient is available in inventory
    isIngredientAvailable(ingredient) {
        return this.inventory.some(item =>
            item.name.toLowerCase().includes(ingredient.name.toLowerCase())
        );
    }

    // Update filter button states
    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }
}

// Initialize menu planner when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.menuPlanner = new MenuPlanner();
}); 