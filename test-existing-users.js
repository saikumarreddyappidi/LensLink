const https = require('https');

// Test login with existing users
const testUsers = [
    { email: "pradeep@gmail.com", password: "password123" },
    { email: "harasha@gmail.com", password: "password123" }
];

async function testLogin(email, password) {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({ email, password });

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

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: JSON.parse(data)
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(loginData);
        req.end();
    });
}

async function runTests() {
    for (const user of testUsers) {
        console.log(`\n=== Testing login for ${user.email} ===`);
        try {
            const result = await testLogin(user.email, user.password);
            console.log('Status Code:', result.statusCode);
            console.log('Success:', result.data.success);
            console.log('Message:', result.data.message);
            if (result.data.data && result.data.data.user) {
                console.log('User ID:', result.data.data.user._id);
                console.log('Name:', result.data.data.user.name);
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

runTests();