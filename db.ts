import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI || '');

export async function connectDB() {
  try {
    await client.connect();
    console.log("⚡ Connected to MongoDB Atlas: The Immutable State Store is active.");
    return client.db("neelakantha_core");
  } catch (error) {
    console.error("🔥 Connection failed! Retrying in 3 seconds...", error);
    setTimeout(connectDB, 3000);
  }
}