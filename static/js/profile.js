// // Mock API for user management
// const MOCK_API = {
//     users: [
//         {
//             id: 1,
//             name: 'John Doe',
//             email: 'john@example.com',
//             password: 'password123',
//             mobile: '+1 234 567 8900',
//             joinedDate: '2025-01-01'
//         },
//         {
//             id: 2,
//             name: 'Jane Smith',
//             email: 'jane@example.com',
//             password: 'password123',
//             mobile: '+1 987 654 3210',
//             joinedDate: '2025-02-15'
//         }
//     ],
    
//     updateUser(id, data) {
//         const userIndex = this.users.findIndex(u => u.id === id);
//         if (userIndex === -1) {
//             return { success: false, message: 'User not found' };
//         }
        
//         const user = this.users[userIndex];
        
//         // Check password if changing
//         if (data.currentPassword && data.password) {
//             if (user.password !== data.currentPassword) {
//                 return { success: false, message: 'Current password is incorrect' };
//             }
//             user.password = data.password;
//         }
        
//         // Update other fields
//         if (data.name) user.name = data.name;
//         if (data.mobile) user.mobile = data.mobile;
        
//         // Return updated user data without password
//         const { password, ...userData } = user;
//         return { success: true, message: 'User updated successfully', user: userData };
//     }
// };

// // Load user data
// document.addEventListener('DOMContentLoaded', function() {
//     loadUserProfile();
// });

// async function loadUserProfile() {
//     const userData = JSON.parse(localStorage.getItem('userData'));
//     if (!userData) {
//         alert('User data not found. Please login again.');
//         window.location.href = 'login.html';
//         return;
//     }
    
//     // Update profile avatar
//     const profileAvatar = document.getElementById('profile-avatar');
//     if (profileAvatar) {
//         profileAvatar.textContent = userData.name.charAt(0).toUpperCase();
//     }
    
//     // Update profile info
//     document.getElementById('profile-name').textContent = userData.name;
//     document.getElementById('profile-email').textContent = userData.email;
//     document.getElementById('profile-joined').textContent = userData.joinedDate;
    
//     // Fill form fields
//     document.getElementById('name').value = userData.name;
//     document.getElementById('email').value = userData.email;
//     document.getElementById('mobile').value = userData.mobile || '';
// }

// async function updateProfile(event) {
//     event.preventDefault();
    
//     const userData = JSON.parse(localStorage.getItem('userData'));
//     if (!userData) {
//         alert('User data not found. Please login again.');
//         window.location.href = 'login.html';
//         return;
//     }
    
//     const name = document.getElementById('name').value;
//     const mobile = document.getElementById('mobile').value;
//     const currentPassword = document.getElementById('current-password').value;
//     const newPassword = document.getElementById('new-password').value;
    
//     // Prepare update data
//     const updateData = {
//         name: name,
//         mobile: mobile || 'Not provided'
//     };
    
//     // Add password if changing
//     if (newPassword && currentPassword) {
//         updateData.password = newPassword;
//         updateData.currentPassword = currentPassword;
//     }
    
//     try {
//         // Use mock API instead of real API
//         const data = MOCK_API.updateUser(userData.id, updateData);
        
//         if (data.success) {
//             // Update local storage
//             localStorage.setItem('userData', JSON.stringify(data.user));
            
//             alert('Profile updated successfully!');
//             window.location.href = 'home.html';
//         } else {
//             alert(data.message || 'Failed to update profile');
//         }
//     } catch (error) {
//         console.error('Update error:', error);
//         alert('An error occurred while updating your profile. Please try again.');
//     }
// }