const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/foodsmart')
    .then(() => console.log('Connected to MongoDB - foodsmart database'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
        dietary: [String],
        notifications: [String]
    },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'users' }); // Explicitly specify the collection name

const User = mongoose.model('User', userSchema);

// Get all users (for testing purposes)
app.get('/api/users', async (req, res) => {
    try {
        console.log('Fetching all users...');
        const users = await User.find({}, { password: 0 }); // Exclude password field
        console.log('Found users:', users);
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching users',
            error: error.message 
        });
    }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        console.log('Received registration request:', {
            ...req.body,
            password: req.body.password ? '***' : undefined
        });

        const { fullName, email, password, preferences } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            preferences: {
                dietary: preferences?.dietary || [],
                notifications: preferences?.notifications || []
            }
        });

        // Save user to database
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                preferences: savedUser.preferences
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        console.log('Received login request:', req.body.email);
        
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful for user:', email);
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Handle 404 for API routes
app.use('/api', (req, res) => {
    console.log('404 - API route not found:', req.originalUrl);
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found' 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 