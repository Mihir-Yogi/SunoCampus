import mongoose from 'mongoose';

const uri = 'mongodb+srv://yogimihir7:Mihir123@sunocampuscluster.lmhnzjw.mongodb.net/SunoCampusDB?retryWrites=true&w=majority';

console.log('Testing MongoDB connection...');
console.log('URI:', uri);

try {
  await mongoose.connect(uri);
  console.log('✓ MongoDB connected successfully!');
  console.log('✓ Ready to proceed with backend development');
  process.exit(0);
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  process.exit(1);
}
