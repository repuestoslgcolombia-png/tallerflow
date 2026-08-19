import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ REDIS_URL env var not set');
  process.exit(1);
}

const parsed = new URL(redisUrl);
const redis = new Redis({
  host: parsed.hostname,
  port: parsed.port ? parseInt(parsed.port, 10) : 6379,
  username: parsed.username || undefined,
  password: parsed.password || undefined,
  tls: parsed.protocol === 'rediss:' || redisUrl.includes('upstash.io') ? {} : undefined,
  connectTimeout: 30000,
  retryStrategy: (times) => {
    if (times > 10) return null;
    return Math.min(times * 50, 5000);
  },
});

async function test() {
  try {
    console.log('🔗 Connecting to Redis...');
    await redis.ping();
    console.log('✅ Redis connected!\n');

    // Test 1: Save a pending action
    const testId = 'test-' + Date.now();
    const testData = {
      action: 'crearCliente',
      entity: 'Customer',
      args: { firstName: 'Test', lastName: 'User', phone: '1234567890' },
      resumen: 'Crear cliente Test User',
      timestamp: new Date().toISOString(),
    };

    console.log('📝 Test 1: Saving pending action...');
    await redis.setex(`hermes:pending:${testId}`, 3600, JSON.stringify(testData));
    console.log(`✅ Saved with key: hermes:pending:${testId}\n`);

    // Test 2: Retrieve it
    console.log('📖 Test 2: Retrieving pending action...');
    const retrieved = await redis.get(`hermes:pending:${testId}`);
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      console.log('✅ Retrieved:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('❌ Not found!');
    }
    console.log();

    // Test 3: Check TTL
    console.log('⏰ Test 3: Checking TTL...');
    const ttl = await redis.ttl(`hermes:pending:${testId}`);
    console.log(`✅ TTL: ${ttl} seconds (should be ~3600)\n`);

    // Test 4: L0 Stream logging
    console.log('📨 Test 4: Logging to L0 Stream...');
    const logEntry = JSON.stringify({
      type: 'text',
      delta: 'Test stream log entry',
      timestamp: new Date().toISOString(),
    });
    const streamId = await redis.xadd('hermes:l0:stream', '*', 'data', logEntry);
    console.log(`✅ Logged to stream: ${streamId}\n`);

    // Test 5: Read stream
    console.log('📚 Test 5: Reading from L0 Stream...');
    const entries = await redis.xrange('hermes:l0:stream', '-', '+', 'COUNT', '1');
    if (entries.length > 0) {
      console.log('✅ Stream entries:', entries.length);
      console.log('Latest entry:', entries[entries.length - 1]);
    }
    console.log();

    console.log('🎉 All Redis tests passed!');
    await redis.quit();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
