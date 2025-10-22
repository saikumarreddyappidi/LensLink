const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb+srv://saikumarreddyappidi274_db_user:Prabkal99@cluster0.qbmu8a8.mongodb.net/lenslink?retryWrites=true&w=majority';

async function resetPasswords() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        
        const users = [
            { email: 'pradeep@gmail.com', newPassword: 'password123' },
            { email: 'harasha@gmail.com', newPassword: 'password123' }
        ];
        
        for (const userData of users) {
            console.log(`\n=== Resetting password for ${userData.email} ===`);
            const user = await User.findOne({ email: userData.email });
            if (user) {
                user.password = userData.newPassword;
                await user.save();
                console.log(`✅ Password reset successful for ${userData.email}`);
                
                // Verify the new password works
                const isMatch = await user.comparePassword(userData.newPassword);
                console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
            } else {
                console.log(`❌ User not found: ${userData.email}`);
            }
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        console.log('\n🎉 Password reset complete! You can now login with:');
        console.log('- pradeep@gmail.com / password123');
        console.log('- harasha@gmail.com / password123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPasswords();