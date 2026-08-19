// Environment variable validation script for build-time checks (ESM version)
// Validates required server environment variables before Next.js build

const requiredVars = [
  'MONGODB_URI',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please add them to .env.local. See .env.example for reference.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');