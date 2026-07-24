document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetForm');
    const emailInput = document.getElementById('email');
    const verificationSection = document.getElementById('verificationSection');
    const newPasswordSection = document.getElementById('newPasswordSection');
    const submitBtn = document.getElementById('submitBtn');
    
    // Check if we're in the verification phase
    if (newPasswordSection.style.display === 'none') {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const securityQuestion = document.getElementById('security_question').value;
            const securityAnswer = document.getElementById('security_answer').value.trim();
            
            try {
                const response = await fetch('/reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        email: email,
                        security_question: securityQuestion,
                        security_answer: securityAnswer
                    })
                });
                
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    const text = await response.text();
                    // Handle any errors here if needed
                    console.error('Unexpected response:', text);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    } else {
        // Password reset phase
        form.addEventListener('submit', function(e) {
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (newPassword !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match!');
                return;
            }
            
            if (newPassword.length < 8) {
                e.preventDefault();
                alert('Password must be at least 8 characters long');
                return;
            }
        });
    }
});