class DonationSystem {
    constructor() {
        this.donations = storage.get('donations') || [];
        this.centers = [
            {
                id: 1,
                name: 'Community Food Bank',
                distance: '0.8 miles',
                accepts: 'All foods',
                rating: 4.8,
                priority: null
            },
            {
                id: 2,
                name: 'Local Shelter',
                distance: '1.2 miles',
                accepts: 'Non-perishables',
                rating: 4.6,
                priority: null
            },
            {
                id: 3,
                name: 'Food Rescue Hub',
                distance: '2.5 miles',
                accepts: 'All foods',
                rating: 4.9,
                priority: 'Fresh produce'
            }
        ];
        this.initializeEventListeners();
        this.renderDonationHistory();
    }

    initializeEventListeners() {
        // Schedule pickup buttons
        document.querySelectorAll('.schedule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.donation-center-card');
                const centerName = card.querySelector('h3').textContent;
                this.schedulePickup(centerName);
            });
        });

        // Generate label buttons
        document.querySelectorAll('.label-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.donation-center-card');
                const centerName = card.querySelector('h3').textContent;
                this.generateLabel(centerName);
            });
        });
    }

    schedulePickup(centerName) {
        const center = this.centers.find(c => c.name === centerName);
        if (!center) return;

        // Get available items from inventory
        const inventory = storage.get('inventory') || [];
        if (inventory.length === 0) {
            this.showNotification('No items available in inventory for donation', 'warning');
            return;
        }

        // Show scheduling modal
        this.showSchedulingModal(center, inventory);
    }

    showSchedulingModal(center, inventory) {
        // Create modal HTML
        const modalHTML = `
            <div id="scheduleModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Schedule Pickup - ${center.name}</h2>
                    <form id="scheduleForm">
                        <div class="form-group">
                            <label>Select Items to Donate</label>
                            <div class="items-selection">
                                ${inventory.map(item => `
                                    <div class="item-checkbox">
                                        <input type="checkbox" id="item-${item.id}" value="${item.id}">
                                        <label for="item-${item.id}">${item.name} (${item.quantity})</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="pickupDate">Pickup Date</label>
                            <input type="date" id="pickupDate" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label for="pickupTime">Preferred Time</label>
                            <select id="pickupTime" required>
                                <option value="morning">Morning (9AM - 12PM)</option>
                                <option value="afternoon">Afternoon (12PM - 4PM)</option>
                                <option value="evening">Evening (4PM - 7PM)</option>
                            </select>
                        </div>
                        <button type="submit" class="btn primary">Schedule Pickup</button>
                    </form>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal elements
        const modal = document.getElementById('scheduleModal');
        const closeBtn = modal.querySelector('.close');
        const form = modal.querySelector('#scheduleForm');

        // Show modal
        modal.style.display = 'block';

        // Close modal on X click
        closeBtn.onclick = () => {
            modal.remove();
        };

        // Close modal on outside click
        window.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };

        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const selectedItems = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => inventory.find(item => item.id === parseInt(cb.value)));
            
            if (selectedItems.length === 0) {
                this.showNotification('Please select at least one item to donate', 'error');
                return;
            }

            const donation = {
                id: Date.now(),
                centerId: center.id,
                centerName: center.name,
                items: selectedItems,
                pickupDate: form.pickupDate.value,
                pickupTime: form.pickupTime.value,
                status: 'scheduled',
                createdAt: new Date().toISOString()
            };

            this.donations.push(donation);
            this.saveDonations();
            this.renderDonationHistory();

            // Remove donated items from inventory
            const inventoryManager = window.inventoryManager;
            if (inventoryManager) {
                selectedItems.forEach(item => {
                    inventoryManager.removeItem(item.id);
                });
            }

            // Award karma points
            eventBus.emit('karmaUpdate', 50 * selectedItems.length);

            // Show success message
            this.showNotification('Pickup scheduled successfully!', 'success');

            // Close modal
            modal.remove();
        };
    }

    generateLabel(centerName) {
        const center = this.centers.find(c => c.name === centerName);
        if (!center) return;

        // Create a printable label
        const labelHTML = `
            <div class="donation-label">
                <h2>${center.name}</h2>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>From: WasteNot FoodSmart User</p>
                <div class="qr-code">
                    <!-- Placeholder for QR code -->
                    <i class="fas fa-qrcode"></i>
                </div>
            </div>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Donation Label - ${center.name}</title>
                    <style>
                        .donation-label {
                            padding: 20px;
                            border: 2px solid #000;
                            max-width: 400px;
                            margin: 20px auto;
                            text-align: center;
                        }
                        .qr-code {
                            margin: 20px 0;
                            font-size: 100px;
                        }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                </head>
                <body>
                    ${labelHTML}
                    <script>
                        window.print();
                    </script>
                </body>
            </html>
        `);
    }

    renderDonationHistory() {
        const listContainer = document.querySelector('.donations-list');
        if (!listContainer) return;

        if (this.donations.length === 0) {
            listContainer.innerHTML = `
                <h3>Donation History</h3>
                <div class="empty-state">
                    <i class="fas fa-gift"></i>
                    <p>No donations yet. Start donating to make a difference!</p>
                </div>
            `;
            return;
        }

        const donationsHTML = this.donations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(donation => `
                <div class="donation-history-item">
                    <div class="donation-header">
                        <h4>${donation.centerName}</h4>
                        <span class="donation-status ${donation.status}">${donation.status}</span>
                    </div>
                    <div class="donation-details">
                        <p>
                            <i class="fas fa-calendar"></i>
                            Pickup: ${new Date(donation.pickupDate).toLocaleDateString()} (${donation.pickupTime})
                        </p>
                        <p>
                            <i class="fas fa-box"></i>
                            Items: ${donation.items.map(item => item.name).join(', ')}
                        </p>
                    </div>
                </div>
            `).join('');

        listContainer.innerHTML = `
            <h3>Donation History</h3>
            ${donationsHTML}
        `;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    saveDonations() {
        storage.save('donations', this.donations);
    }
}

// Initialize donation system
document.addEventListener('DOMContentLoaded', () => {
    window.donationSystem = new DonationSystem();
});

// Listen for inventory removal events
eventBus.on('removeFromInventory', (itemId) => {
    const inventoryManager = window.inventoryManager;
    if (inventoryManager) {
        inventoryManager.removeItem(itemId);
    }
}); 