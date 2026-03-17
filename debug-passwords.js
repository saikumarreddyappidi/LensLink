const mongoose = require('mongoose');
const User = require('./backend/models/User');

const uri = 'mongodb+srv://saikumarreddyappidi274_db_user:Prabkal99@cluster0.qbmu8a8.mongodb.net/lenslink?retryWrites=true&w=majority';

async function checkUserDetails() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        
        const users = ['pradeep@gmail.com', 'harasha@gmail.com'];
        
        for (const email of users) {
            console.log(`\n=== Checking ${email} ===`);
            const user = await User.findOne({ email }).select('+password');
            if (user) {
                console.log('User found:');
                console.log('- Name:', user.name);
                console.log('- Email:', user.email);
                console.log('- Role:', user.role);
                console.log('- Created:', user.createdAt);
                console.log('- Password hash starts with:', user.password.substring(0, 20) + '...');
                console.log('- Password hash length:', user.password.length);
                
                // Test if password is "password123"
                const isMatch = await user.comparePassword('password123');
                console.log('- Matches "password123":', isMatch);
                
                // Test common passwords
                const commonPasswords = ['123456', 'password', 'pradeep123', 'harasha123', 'test123'];
                for (const pwd of commonPasswords) {
                    const match = await user.comparePassword(pwd);
                    if (match) {
                        console.log(`- ✅ FOUND CORRECT PASSWORD: "${pwd}"`);
                        break;
                    }
                }
            } else {
                console.log('User not found!');
            }
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUserDetails();