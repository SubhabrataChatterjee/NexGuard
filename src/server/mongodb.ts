import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env");
}

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    isConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}