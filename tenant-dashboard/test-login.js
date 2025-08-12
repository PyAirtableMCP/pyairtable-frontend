// Simple test script to verify login functionality
const testLogin = async () => {
  console.log('Testing login with Go auth service...');
  
  try {
    const response = await fetch('http://localhost:8082/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      console.error('Login failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('Login successful!');
    console.log('Token:', data.token?.substring(0, 20) + '...');
    console.log('User:', data.user);

    // Test token storage in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      console.log('Token stored in localStorage');
    }

  } catch (error) {
    console.error('Login error:', error);
  }
};

// Run the test if in browser
if (typeof window !== 'undefined') {
  testLogin();
} else {
  console.log('This script should be run in a browser console');
}