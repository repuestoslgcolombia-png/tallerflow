import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

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
    await redis.setex(`pending:${testId}`, 3600, JSON.stringify(testData));
    console.log(`✅ Saved with key: pending:${testId}\n`);

    // Test 2: Retrieve it
    console.log('📖 Test 2: Retrieving pending action...');
    const retrieved = await redis.get(`pending:${testId}`);
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      console.log('✅ Retrieved:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('❌ Not found!');
    }
    console.log();

    // Test 3: Check TTL
    console.log('⏰ Test 3: Checking TTL...');
    const ttl = await redis.ttl(`pending:${testId}`);
    console.log(`✅ TTL: ${ttl} seconds (should be ~3600)\n`);

    // Test 4: L0 Stream logging
    console.log('📨 Test 4: Logging to L0 Stream...');
    const logEntry = JSON.stringify({
      type: 'text',
      delta: 'Test stream log entry',
      timestamp: new Date().toISOString(),
    });
    const streamId = await redis.xadd('l0:stream', '*', 'data', logEntry);
    console.log(`✅ Logged to stream: ${streamId}\n`);

    // Test 5: Read stream
    console.log('📚 Test 5: Reading from L0 Stream...');
    const entries = await redis.xrange('l0:stream', '-', '+', 'COUNT', '1');
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
