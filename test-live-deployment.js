const https = require('https');

async function testLiveDeployment() {
    const timestamp = Date.now();
    const testEmail = `livedeploytest${timestamp}@gmail.com`;
    const testPassword = 'deploypass123';
    
    console.log('🚀 LIVE DEPLOYMENT TEST');
    console.log('======================');
    console.log(`Testing with email: ${testEmail}`);
    console.log('');
    
    try {
        // Test Registration
        console.log('📝 Testing Registration...');
        const regResult = await makeRequest('https://lenslink.live/api/auth/register', 'POST', {
            name: 'Live Deploy Test User',
            email: testEmail,
            password: testPassword,
            role: 'photographer',
            businessName: 'Live Test Photography',
            specialties: ['wedding', 'portrait']
        });
        
        console.log(`✅ Registration Success: ${regResult.data.success}`);
        console.log(`✅ User ID: ${regResult.data.data?.user?._id || 'N/A'}`);
        console.log('');
        
        if (!regResult.data.success) {
            console.log('❌ Registration failed. Stopping test.');
            return;
        }
        
        // Test Login
        console.log('🔐 Testing Login...');
        const loginResult = await makeRequest('https://lenslink.live/api/auth/login', 'POST', {
            email: testEmail,
            password: testPassword
        });
        
        console.log(`✅ Login Success: ${loginResult.data.success}`);
        console.log(`✅ Same User ID: ${loginResult.data.data?.user?._id === regResult.data.data?.user?._id}`);
        console.log('');
        
        // Test with demo users
        console.log('👤 Testing Demo User Login...');
        const demoResult = await makeRequest('https://lenslink.live/api/auth/login', 'POST', {
            email: 'pradeep@gmail.com',
            password: 'password123'
        });
        
        console.log(`✅ Demo Login Success: ${demoResult.data.success}`);
        console.log(`✅ Demo User: ${demoResult.data.data?.user?.name || 'N/A'}`);
        console.log('');
        
        console.log('🎉 LIVE DEPLOYMENT TEST RESULTS:');
        console.log('================================');
        console.log(`✅ Registration: ${regResult.data.success ? 'WORKING' : 'FAILED'}`);
        console.log(`✅ Login: ${loginResult.data.success ? 'WORKING' : 'FAILED'}`);
        console.log(`✅ Demo Users: ${demoResult.data.success ? 'WORKING' : 'FAILED'}`);
        console.log(`✅ Frontend URL: https://lenslink.live`);
        console.log(`✅ Backend URL: https://lenslink-production.up.railway.app`);
        console.log(`✅ Test Email: ${testEmail}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function makeRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(responseData)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: { error: 'Invalid JSON', raw: responseData }
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

testLiveDeployment();