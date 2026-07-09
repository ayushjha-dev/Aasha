import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

async function test() {
  try {
    console.log('Starting in-memory Mongo...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('URI:', uri);
    await mongoose.connect(uri);
    console.log('Mongoose connected successfully!');
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Memory server stopped.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
