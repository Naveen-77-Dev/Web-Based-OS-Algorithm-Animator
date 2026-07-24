// Check if user is logged in
function checkAuth() {
    fetch('/check_auth')
        .then(response => response.json())
        .then(data => {
            if (!data.isLoggedIn) {
                window.location.href = '/login';
            } else {
                loadUserData();
            }
        });
}

// Check if user is logged in for algorithm pages
function checkAuthForAlgorithm() {
    fetch('/check_auth')
        .then(response => response.json())
        .then(data => {
            if (!data.isLoggedIn) {
                alert('Please login to view visualizations');
                window.location.href = '/login';
                return false;
            }
            return true;
        });
}

// Load user data from server
function loadUserData() {
    fetch('/get_user_data')
        .then(response => response.json())
        .then(userData => {
            if (userData.error) {
                console.error(userData.error);
                return;
            }

            // Update user info if elements exist
            const userNameElement = document.getElementById('user-name');
            const userEmailElement = document.getElementById('user-email');
            const userMobileElement = document.getElementById('user-mobile');
            const userJoinedElement = document.getElementById('user-joined');
            
            if (userNameElement) userNameElement.textContent = userData.name || 'Guest User';
            if (userEmailElement) userEmailElement.textContent = userData.email || 'guest@example.com';
            if (userMobileElement) userMobileElement.textContent = userData.mobile || 'Not provided';
            
            // Format join date
            if (userData.created_at) {
                const joinDate = new Date(userData.created_at);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                if (userJoinedElement) userJoinedElement.textContent = joinDate.toLocaleDateString('en-US', options);
            } else if (userJoinedElement) {
                userJoinedElement.textContent = new Date().toLocaleDateString();
            }
            
            // Update user avatar in navbar
            updateUserAvatar(userData);
        })
        .catch(error => {
            console.error('Error loading user data:', error);
        });
}

// Update user avatar in navbar
function updateUserAvatar(userData) {
    const navLinks = document.querySelector('.nav-links');
    
    // Check if avatar already exists
    if (!document.querySelector('.user-avatar')) {
        // Create user avatar element
        const avatarElement = document.createElement('div');
        avatarElement.className = 'user-avatar';
        avatarElement.innerHTML = `
            <div class="avatar-circle" onclick="toggleUserDropdown()">
                ${userData.name ? userData.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div class="user-dropdown" id="user-dropdown">
                <div class="dropdown-header">
                    <strong>${userData.name || 'Guest User'}</strong>
                    <span>${userData.email || 'guest@example.com'}</span>
                </div>
                <div class="dropdown-item" onclick="window.location.href='/profile'">
                    <span>Profile</span>
                </div>
            </div>
        `;
        
        // Add avatar to navbar
        navLinks.appendChild(avatarElement);
        
        // Remove login/register links if they exist
        const loginLink = document.querySelector('a[href="/login"]');
        const registerLink = document.querySelector('a[href="/register"]');
        
        if (loginLink) loginLink.remove();
        if (registerLink) registerLink.remove();
    }
}

// Toggle user dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Toggle user profile section
function toggleUserProfile() {
    const profileSection = document.getElementById('user-profile-section');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (profileSection) {
        profileSection.classList.toggle('expanded');
        toggleIcon.textContent = profileSection.classList.contains('expanded') ? '▲' : '▼';
        
        // Load user data when expanding if not already loaded
        if (profileSection.classList.contains('expanded') && 
            document.getElementById('user-name').textContent === 'Loading...') {
            loadUserData();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check auth on pages that require login
    if (document.querySelector('.user-dashboard') || 
        document.querySelector('.logout-nav')) {
        checkAuth();
    }
    
    // Add scroll to visualization when clicking visualize button
    const visualizeButtons = document.querySelectorAll('.visualize-btn');
    visualizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Check if user is logged in before visualizing
            checkAuthForAlgorithm();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.avatar-circle') && !event.target.closest('.user-dropdown')) {
            const dropdowns = document.querySelectorAll('.user-dropdown.show');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
    
    // Update navbar based on login status
    updateNavbar();
});

// Update navbar based on login status
function updateNavbar() {
    fetch('/check_auth')
        .then(response => response.json())
        .then(data => {
            const navLinks = document.querySelector('.nav-links');
            
            if (data.isLoggedIn) {
                // User is logged in
                const homeLink = document.querySelector('a[href="/index"]');
                if (homeLink) {
                    homeLink.href = '/home';
                    homeLink.textContent = 'Home';
                }
                
                // Add algorithm links if not present
                if (!document.querySelector('a[href="/cpu"]')) {
                    const contactLink = document.querySelector('a[href="/contact"]');
                    if (contactLink) {
                        navLinks.insertBefore(createNavLink('/cpu', 'CPU Scheduling'), contactLink);
                        navLinks.insertBefore(createNavLink('/disk', 'Disk Scheduling'), contactLink);
                        navLinks.insertBefore(createNavLink('/page', 'Page Replacement'), contactLink);
                    }
                }
                
                // Remove login/register links if present
                const loginLink = document.querySelector('a[href="/login"]');
                const registerLink = document.querySelector('a[href="/register"]');
                if (loginLink) loginLink.remove();
                if (registerLink) registerLink.remove();
            } else {
                // User is not logged in
                if (!document.querySelector('a[href="/login"]')) {
                    const contactLink = document.querySelector('a[href="/contact"]');
                    if (contactLink) {
                        navLinks.insertBefore(createNavLink('/login', 'Login'), contactLink);
                        navLinks.insertBefore(createNavLink('/register', 'Register'), contactLink);
                    }
                }
                
                // Remove algorithm links if present
                ['/cpu', '/disk', '/page'].forEach(link => {
                    const algoLink = document.querySelector(`a[href="${link}"]`);
                    if (algoLink) algoLink.remove();
                });
                
                // Remove user avatar if present
                const avatar = document.querySelector('.user-avatar');
                if (avatar) avatar.remove();
            }
        });
}

// Helper function to create nav link
function createNavLink(href, text) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    if (window.location.pathname === href) {
        link.classList.add('active');
    }
    return link;
}