require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Photographer = require('./models/Photographer');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const demos = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@mailtest.com',
      specialties: ['weddings', 'portraits'],
      city: 'New York',
      state: 'NY',
      rate: 180,
      bio: 'Award-winning wedding and portrait photographer with 8 years experience.',
    },
    {
      name: 'Priya Singh',
      email: 'priya.singh@mailtest.com',
      specialties: ['fashion', 'commercial'],
      city: 'Los Angeles',
      state: 'CA',
      rate: 220,
      bio: 'Fashion and commercial photographer working with top brands.',
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus.johnson@mailtest.com',
      specialties: ['events', 'other'],
      city: 'Chicago',
      state: 'IL',
      rate: 150,
      bio: 'Capturing precious family and event moments since 2015.',
    },
  ];

  for (const d of demos) {
    const exists = await User.findOne({ email: d.email });
    if (exists) {
      // Make sure photographer profile exists
      const profile = await Photographer.findOne({ user: exists._id });
      if (!profile) {
        await Photographer.create({
          user: exists._id,
          bio: d.bio,
          specialties: d.specialties,
          location: { city: d.city, state: d.state },
          pricing: { hourlyRate: d.rate },
          isActive: true,
        });
        console.log('Created profile for existing user:', d.name);
      } else {
        // Ensure isActive = true
        profile.isActive = true;
        await profile.save();
        console.log('Skip (already exists):', d.name);
      }
      continue;
    }

    const user = await User.create({
      name: d.name,
      email: d.email,
      password: 'Demo@1234',
      role: 'photographer',
      isVerified: true,
    });

    await Photographer.create({
      user: user._id,
      bio: d.bio,
      specialties: d.specialties,
      location: { city: d.city, state: d.state },
      pricing: { hourlyRate: d.rate },
      isActive: true,
    });

    console.log('Created:', d.name);
  }

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
