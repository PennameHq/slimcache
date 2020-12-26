const redisCacheManager = require('cache-manager')
const redisCacheManagerStore = require('cache-manager-redis-store')

const BaseCache = require('./cache/BaseCache')
const BaseJsonCache = require('./cache/BaseJsonCache')

// 30 minutes in secs
const DEFAULT_TTL_SECS = 60 * 60 * 1

class CacheManager {
  constructor({ host, port, password }) {
    this._redisCache = redisCacheManager.caching({
      store: redisCacheManagerStore,
      host: host,
      port: port,
      auth_pass: password,
    })

    // Listen for redis connection error event
    this._redisClient = this._redisCache.store.getClient()
    console.info('Connected to redis cache')

    this._redisClient.on('error', (err) => {
      // Handle error here
      console.error(`Failed to connect to redis cache due to: ${err.message}`)
    })
  }

  get redisCache() {
    return this._redisCache
  }

  get redisClient() {
    return this._redisClient
  }

  static get Type() {
    return {
      BaseCache,
      BaseJsonCache,
    }
  }

  getCacheByKey(storeKey, { Type, key, defaultTtl, keyMap }) {
    return this._getOrSetF(
      storeKey,
      () =>
        new Type(this, {
          key,
          defaultTtl: defaultTtl || DEFAULT_TTL_SECS,
          keyMap,
        }),
    )
  }

  _getOrSetF(key, getVal) {
    let privateKey = `_${key}`
    if (!this[privateKey]) {
      this[privateKey] = getVal()
    }
    return this[privateKey]
  }
}

module.exports = CacheManager
