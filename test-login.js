const https = require('https');

// Test login with the user we just created
const loginData = JSON.stringify({
    email: "debugtest140552@gmail.com",
    password: "testpass123"
});

const options = {
    hostname: 'lenslink.live',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('Testing login with:');
console.log('Email: debugtest140552@gmail.com');
console.log('Password: testpass123');
console.log('---');

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', JSON.parse(data));
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(loginData);
req.end();