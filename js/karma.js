// Karma Management System
class KarmaManager {
    constructor() {
        this.karmaPoints = parseInt(localStorage.getItem('karmaPoints')) || 0;
        this.karmaHistory = JSON.parse(localStorage.getItem('karmaHistory')) || [];
        this.listeners = [];
        this.initializeKarmaDisplay();
    }

    // Initialize karma displays across the app
    initializeKarmaDisplay() {
        this.updateKarmaDisplays();
        this.initializeAchievements();
    }

    // Add karma points with a reason
    addKarma(points, reason) {
        this.karmaPoints += points;
        
        // Record in history
        this.karmaHistory.push({
            points: points,
            reason: reason,
            timestamp: new Date().toISOString()
        });

        // Save to localStorage
        this.saveKarmaState();
        
        // Update displays
        this.updateKarmaDisplays();
        
        // Check achievements
        this.checkAchievements();
        
        // Notify listeners
        this.notifyListeners();
    }

    // Remove karma points with a reason
    removeKarma(points, reason) {
        this.karmaPoints = Math.max(0, this.karmaPoints - points);
        
        this.karmaHistory.push({
            points: -points,
            reason: reason,
            timestamp: new Date().toISOString()
        });

        this.saveKarmaState();
        this.updateKarmaDisplays();
        this.notifyListeners();
    }

    // Save karma state to localStorage
    saveKarmaState() {
        localStorage.setItem('karmaPoints', this.karmaPoints.toString());
        localStorage.setItem('karmaHistory', JSON.stringify(this.karmaHistory));
    }

    // Update all karma displays in the app
    updateKarmaDisplays() {
        // Update dashboard karma
        const dashboardKarma = document.querySelector('.karma-score');
        if (dashboardKarma) {
            dashboardKarma.textContent = this.karmaPoints;
        }

        // Update top bar karma
        const topBarKarma = document.querySelector('.karma-display span');
        if (topBarKarma) {
            topBarKarma.textContent = `${this.karmaPoints} Karma`;
        }

        // Update karma section total
        const karmaSectionTotal = document.querySelector('#totalKarma');
        if (karmaSectionTotal) {
            karmaSectionTotal.textContent = this.karmaPoints;
        }
    }

    // Initialize achievements based on karma
    initializeAchievements() {
        // Check for Waste Warrior achievement (500 karma)
        const wasteWarriorBadge = document.querySelector('.badge-item[data-achievement="waste-warrior"]');
        if (wasteWarriorBadge && this.karmaPoints >= 500) {
            wasteWarriorBadge.classList.add('achieved');
        }

        // Update achievement cards
        this.updateAchievementCards();
    }

    // Check and update achievements based on current karma
    checkAchievements() {
        // Waste Warrior Achievement (500 karma)
        if (this.karmaPoints >= 500) {
            const wasteWarriorBadge = document.querySelector('.badge-item[data-achievement="waste-warrior"]');
            if (wasteWarriorBadge && !wasteWarriorBadge.classList.contains('achieved')) {
                wasteWarriorBadge.classList.add('achieved');
                this.showAchievementNotification('Waste Warrior', 'Reached 500 Karma points!');
            }
        }

        this.updateAchievementCards();
    }

    // Update achievement cards based on current state
    updateAchievementCards() {
        const achievementCards = document.querySelectorAll('.achievement-card');
        achievementCards.forEach(card => {
            const requiredKarma = parseInt(card.dataset.requiredKarma);
            if (requiredKarma && this.karmaPoints >= requiredKarma) {
                card.classList.add('achieved');
            }
        });
    }

    // Show achievement notification
    showAchievementNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'notification achievement-notification';
        notification.innerHTML = `
            <i class="fas fa-trophy"></i>
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add a listener for karma changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners of karma changes
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.karmaPoints));
    }

    // Get karma history
    getKarmaHistory() {
        return this.karmaHistory;
    }

    // Get current karma points
    getCurrentKarma() {
        return this.karmaPoints;
    }
}

// Initialize the karma manager
const karmaManager = new KarmaManager();

// Example karma events (these should be triggered by actual user actions)
document.addEventListener('DOMContentLoaded', () => {
    // Listen for donation submissions
    const donationForms = document.querySelectorAll('.donation-form');
    donationForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            karmaManager.addKarma(50, 'Made a donation');
        });
    });

    // Listen for inventory additions
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            karmaManager.addKarma(10, 'Added item to inventory');
        });
    }

    // Listen for meal predictions
    const predictionForm = document.getElementById('historicalDataForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            karmaManager.addKarma(15, 'Used meal prediction');
        });
    }
});

// Export the karma manager instance
window.karmaManager = karmaManager; 