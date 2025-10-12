// Script để clear authentication data
// Chạy script này trong browser console để clear tất cả auth data

console.log('🧹 Clearing authentication data...');

// Clear localStorage
localStorage.removeItem('refreshToken');
localStorage.removeItem('tokenExpiry');
localStorage.removeItem('user');
localStorage.removeItem('accessToken');

// Clear sessionStorage
sessionStorage.clear();

// Clear cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Authentication data cleared!');
console.log('🔄 Please refresh the page and try to access /dashboard again');
