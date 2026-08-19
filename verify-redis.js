import Redis from 'ioredis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  tls: {
    rejectUnauthorized: false
  }
});

async function checkRedis() {
  try {
    console.log('🔍 Checking Redis connection...\n');
    
    // Test connection
    const ping = await redis.ping();
    console.log(`✅ Redis ping: ${ping}`);
    
    // Get all keys with pattern
    console.log('\n📋 All keys in Redis:');
    const allKeys = await redis.keys('*');
    console.log(`Found ${allKeys.length} keys:`, allKeys);
    
    // Check pending actions
    console.log('\n⏳ Checking pending actions (pendingAction:*)...');
    const pendingKeys = await redis.keys('pendingAction:*');
    console.log(`Found ${pendingKeys.length} pending action(s)`);
    
    for (const key of pendingKeys) {
      const data = await redis.get(key);
      const ttl = await redis.ttl(key);
      console.log(`\n  Key: ${key}`);
      console.log(`  TTL: ${ttl}s (expires in ~${Math.round(ttl / 60)}m)`);
      console.log(`  Data (first 500 chars):`);
      console.log(`  ${data?.substring(0, 500)}`);
    }
    
    // Check L0 stream
    console.log('\n\n📡 Checking L0 stream (l0:stream)...');
    const streamLen = await redis.xlen('l0:stream');
    console.log(`Stream has ${streamLen} entries`);
    
    if (streamLen > 0) {
      console.log('\nLast 3 L0 entries:');
      const entries = await redis.xrevrange('l0:stream', '+', '-', 'COUNT', 3);
      for (const [id, data] of entries) {
        console.log(`\n  ID: ${id}`);
        // data is an array of [key1, val1, key2, val2, ...]
        for (let i = 0; i < data.length; i += 2) {
          const key = data[i];
          const val = data[i + 1];
          if (key === 'payload' || key === 'type') {
            console.log(`  ${key}: ${val.substring(0, 200)}`);
          }
        }
      }
    }
    
    console.log('\n\n✅ Redis verification complete!');
    
  } catch (error) {
    console.error('❌ Redis error:', error.message);
  } finally {
    await redis.quit();
  }
}

checkRedis();
