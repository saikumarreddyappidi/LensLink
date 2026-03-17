const mongoose = require('mongoose');
const User = require('./models/User');
const Photographer = require('./models/Photographer');

const uri = 'mongodb+srv://saikumarreddyappidi274_db_user:Prabkal99@cluster0.qbmu8a8.mongodb.net/lenslink?retryWrites=true&w=majority';

async function searchUsers() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        
        const searchEmails = ['pradeep@gmail.com', 'harasha@gmail.com'];
        
        console.log('\n🔍 Searching for specific users...');
        
        for (const email of searchEmails) {
            console.log(`\n📧 Searching for: ${email}`);
            
            // Search in users collection
            const user = await User.findOne({ email: email });
            if (user) {
                console.log(`✅ FOUND in Users collection:`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Active: ${user.isActive}`);
                
                // If user is a photographer, check photographer collection
                if (user.role === 'photographer') {
                    const photographer = await Photographer.findOne({ user: user._id });
                    if (photographer) {
                        console.log(`📸 Photographer Profile Found:`);
                        console.log(`   Business Name: ${photographer.businessName || 'N/A'}`);
                        console.log(`   Specialties: ${photographer.specialties?.join(', ') || 'None'}`);
                    }
                }
            } else {
                console.log(`❌ NOT FOUND in database`);
            }
        }
        
        // Also search for similar emails (case insensitive)
        console.log('\n🔍 Checking for similar emails (case insensitive)...');
        const allUsers = await User.find({});
        const similarEmails = allUsers.filter(user => 
            user.email.toLowerCase().includes('pradeep') || 
            user.email.toLowerCase().includes('harasha')
        );
        
        if (similarEmails.length > 0) {
            console.log(`📧 Found ${similarEmails.length} similar email(s):`);
            similarEmails.forEach(user => {
                console.log(`   - ${user.email} (${user.name}) - ${user.role}`);
            });
        } else {
            console.log('📧 No similar emails found');
        }
        
        // Show all users for reference
        console.log('\n📋 All users in database:');
        const totalUsers = await User.find({}).sort({ createdAt: -1 });
        totalUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.createdAt.toLocaleDateString()}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

searchUsers();