// 🧪 MongoDB Atlas Connection Test
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔌 Testing MongoDB Atlas Connection...\n');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.log('❌ Error: MONGODB_URI not found in .env file');
    console.log('📋 Please create a .env file with your MongoDB connection string');
    process.exit(1);
}

console.log('🔗 Connection string found');
console.log('🌐 Attempting to connect to MongoDB Atlas...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('🎉 Your database is ready for LensLink backend');
    console.log('📊 Connection details:');
    console.log(`   - Database: ${mongoose.connection.name}`);
    console.log(`   - Host: ${mongoose.connection.host}`);
    console.log(`   - Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    return TestModel.create({ test: 'LensLink backend test' });
})
.then((doc) => {
    console.log('✅ Database write test successful!');
    console.log('🚀 Your backend is ready for deployment to Render.com!');
    
    // Clean up test document
    return mongoose.connection.db.collection('tests').deleteMany({});
})
.then(() => {
    console.log('🧹 Test cleanup completed');
    process.exit(0);
})
.catch((error) => {
    console.log('❌ MongoDB connection failed:');
    console.log('   Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your connection string in .env file');
    console.log('   2. Ensure password is correct (no < > brackets)');
    console.log('   3. Verify cluster is deployed and running');
    console.log('   4. Check network access allows 0.0.0.0/0');
    process.exit(1);
});
