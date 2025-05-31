// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeChart();
    initializeTipOfTheDay();
    const impactChart = initializeImpactChart();
    
    // Example saved items data
    const savedItems = [
        { type: 'rice', quantity: 1 },
        { type: 'vegetables', quantity: 2 },
        { type: 'fruits', quantity: 1.5 }
    ];
    
    updateImpactStats(savedItems);
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Tip of the Day System
const foodWasteTips = [
    {
        tip: "Store apples in the fridge to keep them fresh for up to 6 weeks longer than at room temperature.",
        category: "Storage"
    },
    {
        tip: "Keep bananas separate from other fruits as they release ethylene gas which speeds up ripening.",
        category: "Storage"
    },
    {
        tip: "Freeze overripe bananas for smoothies or banana bread instead of throwing them away.",
        category: "Reuse"
    },
    {
        tip: "Store herbs like a bouquet in water with a plastic bag over them to extend their life.",
        category: "Storage"
    },
    {
        tip: "Keep potatoes and onions separate - they both last longer when stored apart.",
        category: "Storage"
    },
    {
        tip: "Use your freezer as a pause button - freeze foods approaching their use-by date.",
        category: "Prevention"
    },
    {
        tip: "Make vegetable stock from scraps like carrot tops, celery ends, and onion skins.",
        category: "Reuse"
    },
    {
        tip: "Plan your meals for the week before grocery shopping to avoid overbuying.",
        category: "Planning"
    },
    {
        tip: "Store lettuce with a paper towel to absorb excess moisture and prevent wilting.",
        category: "Storage"
    },
    {
        tip: "Keep a 'eat me first' box in your fridge for items that need to be used soon.",
        category: "Organization"
    },
    {
        tip: "Don't wash berries until you're ready to eat them - moisture speeds up molding.",
        category: "Storage"
    },
    {
        tip: "Use clear storage containers to easily see what leftovers you have.",
        category: "Organization"
    },
    {
        tip: "Revive wilted vegetables by soaking them in ice water for 15 minutes.",
        category: "Revival"
    },
    {
        tip: "Keep milk out of the fridge door where temperature fluctuates most.",
        category: "Storage"
    },
    {
        tip: "Use the FIFO method: First In, First Out - rotate older items to the front.",
        category: "Organization"
    }
];

function initializeTipOfTheDay() {
    const today = new Date().toLocaleDateString();
    const lastTipDate = storage.get('lastTipDate');
    let currentTip = storage.get('currentTip');

    // Check if we need a new tip
    if (lastTipDate !== today) {
        // Get a random tip that's different from the last one
        let newTipIndex;
        do {
            newTipIndex = Math.floor(Math.random() * foodWasteTips.length);
        } while (currentTip && foodWasteTips[newTipIndex].tip === currentTip.tip);

        currentTip = foodWasteTips[newTipIndex];
        storage.save('currentTip', currentTip);
        storage.save('lastTipDate', today);
    }

    // Display the tip
    const tipContent = document.querySelector('.tip-content');
    if (tipContent && currentTip) {
        tipContent.innerHTML = `
            <p>${currentTip.tip}</p>
            <span class="tip-category">${currentTip.category}</span>
        `;
    }
}

// Initialize dashboard chart
function initializeChart() {
    const ctx = document.getElementById('wasteChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Food Waste Reduction (kg)',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#4CAF50',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Food Waste Reduction Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    document.querySelector('.stat-value:nth-child(1)').textContent = `${stats.foodSaved} kg`;
    document.querySelector('.stat-value:nth-child(2)').textContent = stats.karmaPoints;
    document.querySelector('.stat-value:nth-child(3)').textContent = stats.donationsMade;
}

// Local storage management
const storage = {
    save: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};

// Event bus for communication between modules
const eventBus = {
    listeners: {},
    on: (event, callback) => {
        if (!eventBus.listeners[event]) {
            eventBus.listeners[event] = [];
        }
        eventBus.listeners[event].push(callback);
    },
    emit: (event, data) => {
        if (eventBus.listeners[event]) {
            eventBus.listeners[event].forEach(callback => callback(data));
        }
    }
};

// Environmental Impact Chart
function initializeImpactChart() {
    const ctx = document.getElementById('impactChart').getContext('2d');
    const impactChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Water Saved (L)',
                    data: [500, 1200, 1800, 2100, 2300, 2500],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'CO₂ Prevented (kg)',
                    data: [1, 2.2, 3.1, 3.8, 4.2, 4.5],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    return impactChart;
}

// Update impact stats based on saved items
function updateImpactStats(savedItems) {
    const waterSavedEl = document.querySelector('.water-saved .impact-value');
    const carbonReducedEl = document.querySelector('.carbon-reduced .impact-value');
    
    // Calculate total impact
    let totalWaterSaved = 0;
    let totalCarbonReduced = 0;
    
    savedItems.forEach(item => {
        // Water footprint calculations (example values)
        const waterFootprint = {
            rice: 2500, // L/kg
            beef: 15400, // L/kg
            vegetables: 322, // L/kg
            fruits: 962, // L/kg
        };
        
        // Carbon footprint calculations (example values)
        const carbonFootprint = {
            rice: 2.7, // kg CO2/kg
            beef: 60, // kg CO2/kg
            vegetables: 2, // kg CO2/kg
            fruits: 1.1, // kg CO2/kg
        };
        
        const itemType = item.type.toLowerCase();
        const quantity = item.quantity || 1;
        
        totalWaterSaved += (waterFootprint[itemType] || 1000) * quantity;
        totalCarbonReduced += (carbonFootprint[itemType] || 2.5) * quantity;
    });
    
    // Update the display
    if (waterSavedEl) {
        waterSavedEl.textContent = Math.round(totalWaterSaved).toLocaleString();
    }
    if (carbonReducedEl) {
        carbonReducedEl.textContent = totalCarbonReduced.toFixed(1);
    }
} 