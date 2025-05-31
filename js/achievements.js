class AchievementSystem {
    constructor() {
        this.karmaPoints = storage.get('karmaPoints') || 0;
        this.badges = storage.get('badges') || [];
        this.initializeEventListeners();
        this.initializeBadges();
        this.render();
    }

    initializeEventListeners() {
        eventBus.on('karmaUpdate', (points) => {
            this.addKarmaPoints(points);
        });

        eventBus.on('inventoryUpdate', () => {
            this.checkInventoryAchievements();
        });

        eventBus.on('donationMade', () => {
            this.checkDonationAchievements();
        });
    }

    initializeBadges() {
        const defaultBadges = [
            {
                id: 'first_item',
                name: 'First Steps',
                description: 'Add your first item to inventory',
                icon: '🌱',
                earned: false,
                karmaPoints: 50
            },
            {
                id: 'waste_warrior',
                name: 'Waste Warrior',
                description: 'Save 10 items from being wasted',
                icon: '🗑️',
                earned: false,
                karmaPoints: 100
            },
            {
                id: 'generous_donor',
                name: 'Generous Donor',
                description: 'Make your first donation',
                icon: '🎁',
                earned: false,
                karmaPoints: 150
            },
            {
                id: 'inventory_master',
                name: 'Inventory Master',
                description: 'Maintain 20 items in inventory',
                icon: '📦',
                earned: false,
                karmaPoints: 200
            },
            {
                id: 'donation_champion',
                name: 'Donation Champion',
                description: 'Make 5 donations',
                icon: '🏆',
                earned: false,
                karmaPoints: 500
            }
        ];

        // Initialize badges if not already present
        if (this.badges.length === 0) {
            this.badges = defaultBadges;
            this.saveBadges();
        }
    }

    addKarmaPoints(points) {
        this.karmaPoints += points;
        storage.save('karmaPoints', this.karmaPoints);
        this.updateKarmaDisplay();
        this.checkKarmaAchievements();
    }

    awardBadge(badgeId) {
        const badge = this.badges.find(b => b.id === badgeId);
        if (badge && !badge.earned) {
            badge.earned = true;
            badge.earnedDate = new Date().toISOString();
            this.addKarmaPoints(badge.karmaPoints);
            this.saveBadges();
            this.showBadgeNotification(badge);
        }
    }

    checkInventoryAchievements() {
        const inventoryItems = storage.get('inventory') || [];
        
        if (inventoryItems.length >= 1) {
            this.awardBadge('first_item');
        }
        
        if (inventoryItems.length >= 20) {
            this.awardBadge('inventory_master');
        }
    }

    checkDonationAchievements() {
        const donations = storage.get('donations') || [];
        
        if (donations.length >= 1) {
            this.awardBadge('generous_donor');
        }
        
        if (donations.length >= 5) {
            this.awardBadge('donation_champion');
        }
    }

    checkKarmaAchievements() {
        // Add more karma-based achievements here
    }

    showBadgeNotification(badge) {
        const notification = `
            Congratulations! You've earned the "${badge.name}" badge!
            +${badge.karmaPoints} Karma Points
        `;
        alert(notification);
    }

    saveBadges() {
        storage.save('badges', this.badges);
    }

    updateKarmaDisplay() {
        document.getElementById('totalKarma').textContent = this.karmaPoints;
    }

    render() {
        const badgesContainer = document.querySelector('.badges-container');
        badgesContainer.innerHTML = '';

        this.badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge ${badge.earned ? 'earned' : ''}`;
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
                <div class="badge-status">
                    ${badge.earned 
                        ? `<span class="earned-text">Earned on ${new Date(badge.earnedDate).toLocaleDateString()}</span>`
                        : '<span class="locked-text">Locked</span>'
                    }
                </div>
            `;
            badgesContainer.appendChild(badgeElement);
        });

        this.updateKarmaDisplay();
    }
}

// Initialize achievement system
const achievementSystem = new AchievementSystem(); 