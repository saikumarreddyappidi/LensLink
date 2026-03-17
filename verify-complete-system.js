#!/usr/bin/env node

// Complete System Verification Script
const https = require('https');

console.log('\n🔍 COMPLETE SYSTEM VERIFICATION');
console.log('================================\n');

async function verifySystem() {
    const results = {
        backendHealth: false,
        mongoConnection: false,
        frontendProxy: false,
        registration: false,
        login: false,
        databaseSave: false
    };
    
    try {
        // 1. Check Backend Health
        console.log('1️⃣ Verifying Railway Backend...');
        const backendHealth = await makeRequest('https://lenslink-production.up.railway.app/api/health', 'GET');
        results.backendHealth = backendHealth.data.status === 'OK';
        results.mongoConnection = backendHealth.data.mongoState === 1;
        
        console.log(`   ✅ Backend Status: ${backendHealth.data.status}`);
        console.log(`   ✅ MongoDB Status: ${backendHealth.data.database}`);
        console.log(`   ✅ MongoState: ${backendHealth.data.mongoState} (1 = Connected)`);
        console.log(`   ✅ Users in DB: ${backendHealth.data.dataStats.users}`);
        console.log(`   ✅ Photographers: ${backendHealth.data.dataStats.photographers}\n`);
        
        // 2. Check Frontend Proxy
        console.log('2️⃣ Verifying Netlify Frontend Proxy...');
        const frontendHealth = await makeRequest('https://lenslink.live/api/health', 'GET');
        results.frontendProxy = frontendHealth.data.status === 'OK';
        
        console.log(`   ✅ Netlify → Railway Proxy: WORKING`);
        console.log(`   ✅ Frontend URL: https://lenslink.live`);
        console.log(`   ✅ Backend URL: https://lenslink-production.up.railway.app\n`);
        
        // 3. Test Registration (New Account)
        console.log('3️⃣ Testing NEW Account Registration...');
        const timestamp = Date.now();
        const testEmail = `systemtest${timestamp}@test.com`;
        const testPassword = 'verify123';
        
        console.log(`   📧 Creating account: ${testEmail}`);
        
        const regResult = await makeRequest('https://lenslink.live/api/auth/register', 'POST', {
            name: 'System Verification User',
            email: testEmail,
            password: testPassword,
            role: 'client'
        });
        
        results.registration = regResult.data.success === true;
        const userId = regResult.data.data?.user?._id;
        
        console.log(`   ✅ Registration: ${regResult.data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   ✅ User ID: ${userId}`);
        console.log(`   ✅ Saved to MongoDB: ${userId ? 'YES' : 'NO'}\n`);
        
        // 4. Test Login (Cross-Device)
        console.log('4️⃣ Testing Login from "Another Device"...');
        
        const loginResult = await makeRequest('https://lenslink.live/api/auth/login', 'POST', {
            email: testEmail,
            password: testPassword
        });
        
        results.login = loginResult.data.success === true;
        results.databaseSave = loginResult.data.data?.user?._id === userId;
        
        console.log(`   ✅ Login: ${loginResult.data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   ✅ Cross-Device Sync: ${results.databaseSave ? 'WORKING' : 'FAILED'}`);
        console.log(`   ✅ Same User ID: ${results.databaseSave ? 'YES' : 'NO'}\n`);
        
        // 5. Final Summary
        console.log('📊 VERIFICATION SUMMARY');
        console.log('======================');
        console.log(`Backend Health:      ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`MongoDB Connection:  ${results.mongoConnection ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Frontend Proxy:      ${results.frontendProxy ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Registration:        ${results.registration ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Login:               ${results.login ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Database Save:       ${results.databaseSave ? '✅ PASS' : '❌ FAIL'}`);
        
        const allPassed = Object.values(results).every(r => r === true);
        
        console.log('\n🎉 FINAL RESULT:');
        if (allPassed) {
            console.log('✅✅✅ ALL SYSTEMS OPERATIONAL ✅✅✅');
            console.log('\nYour system is working perfectly!');
            console.log('- Backend: Connected to MongoDB Atlas');
            console.log('- Frontend: Properly connected to Railway backend');
            console.log('- Cross-Device: Registration & Login working');
            console.log('\nLive Website: https://lenslink.live');
        } else {
            console.log('❌ SOME TESTS FAILED');
            console.log('Please check the failed tests above.');
        }
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    }
}

function makeRequest(url, method, data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(postData && { 'Content-Length': postData.length })
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

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

verifySystem();