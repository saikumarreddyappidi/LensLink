const mongoose = require('mongoose');
const User = require('./models/User');
const Photographer = require('./models/Photographer');

const uri = 'mongodb+srv://saikumarreddyappidi274_db_user:Prabkal99@cluster0.qbmu8a8.mongodb.net/lenslink?retryWrites=true&w=majority';

async function checkDatabase() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        
        const users = await User.find({});
        const photographers = await Photographer.find({});
        
        console.log('👥 Users count:', users.length);
        console.log('📸 Photographers count:', photographers.length);
        
        if(users.length > 0) {
            console.log('\n📋 Recent users:');
            users.slice(-5).forEach(u => {
                console.log(`- ${u.name} (${u.email}) - Role: ${u.role} - Created: ${u.createdAt}`);
            });
        }
        
        if(photographers.length > 0) {
            console.log('\n📸 Recent photographers:');
            photographers.slice(-5).forEach(p => {
                console.log(`- ID: ${p._id} - User: ${p.user} - Business: ${p.businessName || 'N/A'}`);
            });
        }
        
        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📦 Collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();