/**
 * MongoDB Atlas Connection Checker
 * Run: node check-connection.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

async function checkConnection() {
  console.log('\n🔍 SurpriseNest — MongoDB Connection Checker\n');
  console.log('─'.repeat(50));

  // Step 1: Check if MONGO_URI is loaded
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('localhost')) {
    console.log('❌ STEP 1 — .env not loading properly');
    console.log('   MONGO_URI =', uri || 'undefined');
    console.log('\n   Fix: Make sure you are running from the backEnd/ folder\n');
    process.exit(1);
  }
  console.log('✅ STEP 1 — .env loaded correctly');
  // Mask password for display
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('   URI =', maskedUri);

  // Step 2: Check DNS / internet connectivity
  console.log('\n⏳ STEP 2 — Checking internet & DNS...');
  try {
    // Extract hostname from mongodb+srv://
    const hostname = uri.split('@')[1]?.split('/')[0];
    if (hostname) {
      await dns.lookup(hostname);
      console.log('✅ STEP 2 — DNS resolved:', hostname);
    }
  } catch (err) {
    console.log('❌ STEP 2 — DNS failed:', err.message);
    console.log('\n   This means either:');
    console.log('   1. No internet connection');
    console.log('   2. Atlas cluster hostname is wrong in your .env');
    console.log('   3. Network Access on Atlas is blocking you\n');
    process.exit(1);
  }

  // Step 3: Try connecting
  console.log('\n⏳ STEP 3 — Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ STEP 3 — Connected to:', mongoose.connection.host);
    console.log('\n🎉 ATLAS IS READY! You can now run: npm run seed\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log('❌ STEP 3 — Connection failed:', err.message);
    console.log('\n   Most likely cause:');
    if (err.message.includes('Authentication')) {
      console.log('   → Wrong password in MONGO_URI');
      console.log('   Fix: Check the password for SurpriseNest_db in Atlas → Database Access');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.log('   → Atlas Network Access is blocking your IP');
      console.log('   Fix: Go to Atlas → Security → Network Access');
      console.log('        Click "+ ADD IP ADDRESS" → "ALLOW ACCESS FROM ANYWHERE"');
    } else {
      console.log('  ', err.message);
    }
    console.log();
    process.exit(1);
  }
}

checkConnection();
