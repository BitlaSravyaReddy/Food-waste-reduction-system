class InventoryManager {
    constructor() {
        this.items = storage.get('inventory') || [];
        this.initializeEventListeners();
        this.render();
        this.updateInventoryCount();
    }

    initializeEventListeners() {
        // Add item form submission
        const form = document.getElementById('addItemForm');
        if (!form) {
            console.error('Add item form not found');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted'); // Debug log
            
            // Get form values
            const newItem = {
                name: e.target.itemName.value.trim(),
                quantity: e.target.itemQuantity.value.trim(),
                expiryDate: e.target.expiryDate.value,
                addedDate: new Date().toISOString(),
                id: Date.now()
            };

            console.log('New item:', newItem); // Debug log

            // Validate input
            if (!this.validateItem(newItem)) {
                return;
            }

            // Add item with animation
            this.addItem(newItem);

            // Reset form with smooth transition
            e.target.reset();
            e.target.itemName.focus();

            // Show success message
            this.showNotification(`Successfully added ${newItem.name} to inventory!`, 'success');
        });

        // Search functionality with debounce
        const searchInput = document.getElementById('searchInventory');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterItems(e.target.value);
                }, 300);
            });
        }
    }

    validateItem(item) {
        if (!item.name) {
            this.showNotification('Please enter an item name', 'error');
            return false;
        }
        if (!item.quantity) {
            this.showNotification('Please enter a quantity', 'error');
            return false;
        }
        if (!item.expiryDate) {
            this.showNotification('Please select an expiry date', 'error');
            return false;
        }
        
        // Check if expiry date is not in the past
        if (new Date(item.expiryDate) < new Date().setHours(0, 0, 0, 0)) {
            this.showNotification('Expiry date cannot be in the past', 'error');
            return false;
        }
        
        return true;
    }

    addItem(item) {
        console.log('Adding item to inventory:', item); // Debug log
        
        // Add item to array
        this.items.push(item);
        
        // Save to storage
        this.saveInventory();
        
        // Update UI
        this.render();
        this.updateInventoryCount();
        
        // Highlight new item
        setTimeout(() => {
            const newItemElement = document.querySelector(`[data-item-id="${item.id}"]`);
            if (newItemElement) {
                newItemElement.classList.add('item-added');
                setTimeout(() => {
                    newItemElement.classList.remove('item-added');
                }, 1500);
            }
        }, 0);

        // Update karma points
        eventBus.emit('karmaUpdate', 5);
    }

    removeItem(id) {
        const itemToRemove = document.querySelector(`[data-item-id="${id}"]`);
        if (itemToRemove) {
            // Add removal animation
            itemToRemove.classList.add('item-removed');
            
            // Remove after animation
            setTimeout(() => {
                this.items = this.items.filter(item => item.id !== id);
                this.saveInventory();
                this.render();
                this.updateInventoryCount();
            }, 300);
        }
    }

    updateItem(id, updates) {
        this.items = this.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
        );
        this.saveInventory();
        this.render();
    }

    updateInventoryCount() {
        const expiringCount = this.items.filter(item => {
            const status = this.getExpiryStatus(item.expiryDate);
            return status.status === 'warning' || status.status === 'danger';
        }).length;

        // Update the header if it exists
        const headerCount = document.querySelector('.inventory-count');
        if (headerCount) {
            headerCount.textContent = `${this.items.length} items`;
        }

        // Update warning count if it exists
        const warningCount = document.querySelector('.warning');
        if (warningCount && expiringCount > 0) {
            warningCount.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${expiringCount} items expiring soon!`;
            warningCount.style.display = 'block';
        } else if (warningCount) {
            warningCount.style.display = 'none';
        }
    }

    filterItems(searchTerm) {
        const filteredItems = searchTerm
            ? this.items.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : this.items;
        this.render(filteredItems);
    }

    getExpiryStatus(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
            return { status: 'danger', message: 'Expired' };
        } else if (daysUntilExpiry <= 3) {
            return { status: 'danger', message: 'Expires today!' };
        } else if (daysUntilExpiry <= 7) {
            return { status: 'warning', message: `Expires in ${daysUntilExpiry} days` };
        }
        return { status: 'good', message: `Expires in ${daysUntilExpiry} days` };
    }

    checkExpiryDates() {
        const today = new Date();
        const warningDays = 3;

        this.items.forEach(item => {
            const expiryDate = new Date(item.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= warningDays && daysUntilExpiry > 0) {
                this.showNotification(`Warning: ${item.name} will expire in ${daysUntilExpiry} days!`, 'warning');
            } else if (daysUntilExpiry <= 0) {
                this.showNotification(`Alert: ${item.name} has expired!`, 'error');
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add to notification container or create one
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Add notification to container
        container.appendChild(notification);

        // Remove after delay
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

    saveInventory() {
        console.log('Saving inventory:', this.items); // Debug log
        storage.save('inventory', this.items);
        eventBus.emit('inventoryUpdate', this.items);
    }

    render(itemsToRender = this.items) {
        console.log('Rendering items:', itemsToRender); // Debug log
        
        const inventoryList = document.querySelector('.inventory-list');
        if (!inventoryList) {
            console.error('Inventory list container not found');
            return;
        }
        
        if (itemsToRender.length === 0) {
            inventoryList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Your inventory is empty. Add some items!</p>
                </div>
            `;
            return;
        }

        // Sort items by expiry date
        const sortedItems = [...itemsToRender].sort((a, b) => 
            new Date(a.expiryDate) - new Date(b.expiryDate)
        );

        inventoryList.innerHTML = sortedItems.map(item => {
            const expiryStatus = this.getExpiryStatus(item.expiryDate);
            return `
                <div class="inventory-item" data-item-id="${item.id}">
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-meta">
                            <span><i class="fas fa-box"></i> ${item.quantity}</span>
                            <span class="expiry-${expiryStatus.status}">
                                <i class="fas fa-clock"></i> ${expiryStatus.message}
                            </span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn" onclick="inventoryManager.removeItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize inventory manager
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});

// Check expiry dates periodically
setInterval(() => {
    if (window.inventoryManager) {
        window.inventoryManager.checkExpiryDates();
    }
}, 1000 * 60 * 60); // Check every hour

document.addEventListener('DOMContentLoaded', () => {
    const inventoryForm = document.getElementById('inventoryForm');
    const message = document.getElementById('message');

    // Set default purchase date to today
    document.getElementById('purchaseDate').valueAsDate = new Date();

    // Validate that expiry date is after purchase date
    document.getElementById('expiryDate').addEventListener('change', (e) => {
        const purchaseDate = new Date(document.getElementById('purchaseDate').value);
        const expiryDate = new Date(e.target.value);
        
        if (expiryDate <= purchaseDate) {
            e.target.value = '';
            showMessage('Expiry date must be after purchase date', 'error');
        }
    });

    inventoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('itemName').value,
            quantity: parseFloat(document.getElementById('quantity').value),
            unit: document.getElementById('unit').value,
            purchaseDate: document.getElementById('purchaseDate').value,
            expiryDate: document.getElementById('expiryDate').value,
            storageLocation: document.getElementById('storageLocation').value,
            notes: document.getElementById('notes').value
        };

        try {
            // Get the token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Item added successfully!', 'success');
                inventoryForm.reset();
                // Reset purchase date to today
                document.getElementById('purchaseDate').valueAsDate = new Date();
                
                // Redirect to inventory list after 2 seconds
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Failed to add item. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error adding inventory:', error);
            showMessage('An error occurred. Please try again later.', 'error');
        }
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    }
}); 