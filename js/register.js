document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const message = document.getElementById('message');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Password visibility toggle
    [togglePassword, toggleConfirmPassword].forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const input = toggle.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggle.querySelector('i').className = 
                type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        // Get form data
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: passwordInput.value,
            preferences: {
                dietaryRestrictions: Array.from(document.querySelectorAll('input[name="dietaryRestrictions"]:checked'))
                    .map(checkbox => checkbox.value),
                notificationPreferences: {
                    expiryAlerts: document.querySelector('input[name="expiryAlerts"]').checked,
                    inventoryReminders: document.querySelector('input[name="inventoryReminders"]').checked
                }
            }
        };

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token
                localStorage.setItem('token', data.token);
                
                // Show success message
                showMessage('Registration successful! Redirecting...', 'success');
                
                // Redirect to main page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('An error occurred. Please try again later.', 'error');
        }
    });

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}`;
        message.style.display = 'block';
        
        if (type === 'success') {
            message.style.display = 'block';
        } else {
            // Hide error messages after 5 seconds
            setTimeout(() => {
                message.style.display = 'none';
            }, 5000);
        }
    }

    // Real-time password validation
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePassword);

    function validatePassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password && confirmPassword) {
            if (password !== confirmPassword) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        }
    }
}); 