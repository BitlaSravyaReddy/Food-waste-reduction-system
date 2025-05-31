document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Password visibility toggle
    togglePassword.addEventListener('click', () => {
        // Toggle password visibility
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle eye icon
        togglePassword.querySelector('i').className = 
            type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        // Get stored credentials
        const storedCredentials = JSON.parse(localStorage.getItem('demoCredentials'));

        if (email === storedCredentials.username && password === storedCredentials.password) {
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to index.html after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage('Invalid credentials. Please try demo@foodsmart.com / demo123', 'error');
        }
    });

    function showMessage(text, type) {
        errorMessage.textContent = text;
        errorMessage.className = `error-message ${type}`;
        errorMessage.style.display = 'block';
        
        if (type === 'success') {
            errorMessage.style.display = 'block';
        } else {
            // Hide error messages after 5 seconds
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
}); 