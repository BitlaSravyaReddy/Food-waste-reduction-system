class DonationCenters {
    constructor() {
        this.donationCenters = [
            {
                name: "Akshaya Patra Foundation",
                distance: "2.5 miles",
                acceptedItems: "Rice, Dal, Fresh Vegetables, Cooking Oil",
                rating: 4.9,
                address: "Survey No. 185/A, Chitkul Village, Patancheru Mandal, Hyderabad",
                hours: "Mon-Sat: 9AM-6PM",
                type: ["fresh", "packaged", "prepared"]
            },
            {
                name: "Roti Bank Hyderabad",
                distance: "1.2 miles",
                acceptedItems: "Prepared Meals, Bread, Rice Items",
                rating: 4.7,
                address: "Road No. 12, Banjara Hills, Hyderabad",
                hours: "24/7 Collection",
                type: ["prepared", "packaged"]
            },
            {
                name: "SAFA Society Food Bank",
                distance: "3.1 miles",
                acceptedItems: "All foods, Dry Rations, Fresh Produce",
                rating: 4.8,
                address: "16-11-20/1/C, Shahalibanda, Hyderabad",
                hours: "Mon-Sat: 10AM-8PM",
                type: ["fresh", "packaged"]
            },
            {
                name: "Feeding India - Hyderabad Chapter",
                distance: "0.8 miles",
                acceptedItems: "All types of food items, Priority: Fresh meals",
                rating: 4.9,
                address: "Plot 123, Jubilee Hills, Hyderabad",
                hours: "Mon-Sun: 8AM-9PM",
                type: ["fresh", "packaged", "prepared"]
            },
            {
                name: "Anna Daan Foundation",
                distance: "1.5 miles",
                acceptedItems: "Rice, Vegetables, Fruits, Packaged Foods",
                rating: 4.6,
                address: "6-3-456, Punjagutta, Hyderabad",
                hours: "Mon-Sat: 7AM-7PM",
                type: ["fresh", "packaged"]
            },
            {
                name: "Hyderabad Food Bank",
                distance: "4.2 miles",
                acceptedItems: "Grains, Pulses, Oil, Spices, Fresh Produce",
                rating: 4.8,
                address: "Plot No. 45, Gachibowli, Hyderabad",
                hours: "Mon-Fri: 9AM-5PM",
                type: ["fresh", "packaged"]
            },
            {
                name: "Robin Hood Army - Hyderabad",
                distance: "2.8 miles",
                acceptedItems: "Fresh Meals, Groceries, Fruits & Vegetables",
                rating: 4.9,
                address: "Road No. 3, HITEC City, Hyderabad",
                hours: "24/7",
                type: ["fresh", "packaged", "prepared"]
            },
            {
                name: "Warangal Food Support Center",
                distance: "85.2 miles",
                acceptedItems: "Rice, Vegetables, Fruits, Dry Rations",
                rating: 4.7,
                address: "Near NIT Campus, Kazipet, Warangal",
                hours: "Mon-Sat: 8AM-6PM",
                type: ["fresh", "packaged"]
            },
            {
                name: "Nizamabad Community Kitchen",
                distance: "115.6 miles",
                acceptedItems: "Fresh Meals, Groceries, Vegetables",
                rating: 4.6,
                address: "Market Road, Near Bus Stand, Nizamabad",
                hours: "Mon-Sun: 9AM-7PM",
                type: ["fresh", "prepared", "packaged"]
            },
            {
                name: "Karimnagar Food Bank",
                distance: "98.4 miles",
                acceptedItems: "All types of food items, Grains, Pulses",
                rating: 4.8,
                address: "Tower Circle, Karimnagar",
                hours: "Mon-Sat: 7AM-8PM",
                type: ["fresh", "packaged"]
            },
            {
                name: "Khammam Hunger Relief",
                distance: "125.3 miles",
                acceptedItems: "Rice, Dal, Fresh Produce, Cooked Meals",
                rating: 4.7,
                address: "Temple Street, Near Railway Station, Khammam",
                hours: "24/7 Collection",
                type: ["fresh", "packaged", "prepared"]
            },
            {
                name: "Siddipet Food Support",
                distance: "65.8 miles",
                acceptedItems: "Vegetables, Fruits, Dry Rations, Prepared Meals",
                rating: 4.5,
                address: "Collectorate Road, Siddipet",
                hours: "Mon-Sun: 8AM-8PM",
                type: ["fresh", "packaged", "prepared"]
            }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showDonationCenters();
    }

    setupEventListeners() {
        // Search location input
        document.getElementById('locationSearch').addEventListener('input', () => {
            this.filterDonationCenters();
        });

        // Filter changes
        document.getElementById('donationTypeFilter').addEventListener('change', () => {
            this.filterDonationCenters();
        });

        document.getElementById('radiusFilter').addEventListener('input', () => {
            this.filterDonationCenters();
        });
    }

    filterDonationCenters() {
        const searchTerm = document.getElementById('locationSearch').value.toLowerCase();
        const type = document.getElementById('donationTypeFilter').value;
        const radius = parseFloat(document.getElementById('radiusFilter').value) || 5;

        const filteredCenters = this.donationCenters.filter(center => {
            // Filter by search term
            const matchesSearch = center.name.toLowerCase().includes(searchTerm) ||
                                center.address.toLowerCase().includes(searchTerm);

            // Filter by type
            const matchesType = type === 'all' || center.type.includes(type);

            // Filter by radius (assuming distance is in format "X.X miles")
            const centerDistance = parseFloat(center.distance);
            const matchesRadius = centerDistance <= radius;

            return matchesSearch && matchesType && matchesRadius;
        });

        this.displayDonationCenters(filteredCenters);
    }

    displayDonationCenters(centers) {
        const container = document.querySelector('.donation-centers');
        
        if (centers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No donation centers found matching your criteria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = centers.map(center => `
            <div class="donation-center-card">
                <div class="center-info">
                    <h3>${center.name}</h3>
                    <div class="center-details">
                        <div class="detail">
                            <i class="fas fa-location-dot"></i>
                            <span>${center.distance}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-box"></i>
                            <span>Accepts: ${center.acceptedItems}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-star"></i>
                            <span>${center.rating} rating</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-clock"></i>
                            <span>${center.hours}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${center.address}</span>
                        </div>
                    </div>
                </div>
                <div class="center-actions">
                    <button class="btn primary schedule-btn" onclick="donationCenters.schedulePickup('${center.name}')">
                        <i class="fas fa-calendar"></i> Schedule Pickup
                    </button>
                    <button class="btn secondary label-btn" onclick="donationCenters.generateLabel('${center.name}')">
                        <i class="fas fa-tag"></i> Generate Label
                    </button>
                </div>
            </div>
        `).join('');
    }

    showDonationCenters() {
        this.displayDonationCenters(this.donationCenters);
    }

    schedulePickup(centerName) {
        // Implement scheduling functionality
        console.log(`Scheduling pickup at ${centerName}`);
        // You could show a modal or navigate to a scheduling page
        alert(`Scheduling pickup at ${centerName}`);
    }

    generateLabel(centerName) {
        // Implement label generation
        console.log(`Generating label for ${centerName}`);
        // You could open a print dialog or download a PDF
        alert(`Generating donation label for ${centerName}`);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.donationCenters = new DonationCenters();
}); 