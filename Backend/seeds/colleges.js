import connectDB from '../config/db.js';
import College from '../models/College.js';
import dotenv from 'dotenv';

dotenv.config();

const colleges = [
  {
    name: 'Ganpat University',
    emailDomain: 'gnu.ac.in',
    location: 'Mehsana, Gujarat',
    website: 'https://www.ganpat.ac.in',
    abbreviation: 'GNU',
    isActive: true,
  },
  {
    name: 'Indian Institute of Information Technology, Bangalore',
    emailDomain: 'iiitb.ac.in',
    location: 'Bangalore, Karnataka',
    website: 'https://www.iiitb.ac.in',
    abbreviation: 'IIITB',
    isActive: true,
  },
  {
    name: 'Delhi Technological University',
    emailDomain: 'dtu.ac.in',
    location: 'New Delhi',
    website: 'https://dtu.ac.in',
    abbreviation: 'DTU',
    isActive: true,
  },
  {
    name: 'Birla Institute of Technology and Science',
    emailDomain: 'bits-pilani.ac.in',
    location: 'Pilani, Rajasthan',
    website: 'https://www.bits-pilani.ac.in',
    abbreviation: 'BITS',
    isActive: true,
  },
  {
    name: 'Indian Institute of Technology, Delhi',
    emailDomain: 'iitd.ac.in',
    location: 'New Delhi',
    website: 'https://home.iitd.ac.in',
    abbreviation: 'IIT Delhi',
    isActive: true,
  },
  {
    name: 'National Institute of Technology, Rourkela',
    emailDomain: 'nitrkl.ac.in',
    location: 'Rourkela, Odisha',
    website: 'https://www.nitrkl.ac.in',
    abbreviation: 'NIT Rkl',
    isActive: true,
  },
  {
    name: 'Miranda House',
    emailDomain: 'mirandahouse.ac.in',
    location: 'New Delhi',
    website: 'https://mirandahouse.ac.in',
    abbreviation: 'MH',
    isActive: true,
  },
  {
    name: 'St. Stephens College',
    emailDomain: 'ststephens.ac.in',
    location: 'New Delhi',
    website: 'https://ststephens.ac.in',
    abbreviation: 'StS',
    isActive: true,
  },
];

const seedColleges = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing colleges
    await College.deleteMany({});
    console.log('Cleared existing colleges');

    // Insert colleges
    const result = await College.insertMany(colleges, { ordered: false });
    console.log(`✓ Successfully seeded ${result.length} colleges`);

    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('Some colleges already exist in database');
      process.exit(0);
    }
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedColleges();
