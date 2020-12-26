const redisScanner = require('redis-scanner')

const tag = {
  recordKey: 'rky',
  typePrefix: 'tpf',
  typeKey: 'tpk',
  currentUserId: 'uid',
}

const promise = (callback) => {
  return new Promise((resolve) => resolve()).then(callback)
}

class BaseCache {
  constructor(cacheManager, { modelType, ttl, KeyMap = {} }) {
    // Subclass must set this
    this._prefix = undefined

    this._cacheManager = cacheManager
    this._modelType = modelType

    // ttl is in seconds
    this._ttl = ttl || modelType.defaultTtl || 60

    this._keyMap = { ...KeyMap }
  }

  get prefix() {
    return this._prefix
  }

  get ttl() {
    return this._ttl
  }

  get cacheManager() {
    return this._cacheManager
  }

  get Key() {
    return this._keyMap
  }

  /**
   * 
   * @param {{
   	key: string,
	currentUserId: ?string,
   * }} config
   * @protected
   */
  _getCacheKey({ key, currentUserId }) {
    let cacheKey = `${this._prefix}<${tag.recordKey}>${key}<|${tag.recordKey}>`

    if (currentUserId) {
      cacheKey += `<${tag.currentUserId}>${currentUserId}<|${tag.currentUserId}>`
    }

    return cacheKey
  }

  /**
	 *
	 * @param {{
		key: string,
		currentUserId: ?string,
		value: string,
		ttl: ?number,
	 * }} config
	 * @protected
	 */
  _set(data) {
    return promise(() => {
      let key = this._getCacheKey(data)
      return this.cacheManager.redisCache.set(key, `${data.value}`, { ttl: data.ttl || this._ttl })
    })
  }

  /**
	 *
	 * @param {{
		key: string,
		currentUserId: ?string,
		value: any,
	 * }} config
	 * @protected
	 */
  _setJson(data) {
    return promise(() => {
      return this._set({ ...data, value: JSON.stringify(data.value) })
    })
  }

  /**
	 *
	 * @param {{
		key: string,
		currentUserId: ?string,
	 * }} config
	 * @protected
	 */
  _delete(data) {
    return promise(() => {
      return this._deleteByKey(this._getCacheKey(data))
    })
  }

  _deleteByKey(key) {
    return this.cacheManager.redisCache.del(key)
  }

  _getByKey(key) {
    return new Promise((resolve, reject) => {
      return this.cacheManager.redisCache.get(key, (err, value) => {
        if (err || value == undefined) {
          return reject(err || new Error(`No value found for ${key}`))
        }
        return resolve(value)
      })
    })
  }

  /**
   * Deletes all cached keys that include this object's id
   * https://github.com/fritzy/node-redisscan
   *
   * TODO(lincoln) make a decision on using this -> pattern: `${this.prefix}*`
   * Using it will ignore other keys from other caches (i.e. ModelRefCache) that may contain the object's id.
   * Not using it catches all keys that use the object's id, but makes the cache more volatile.
   *
   * @param {String} keyword
   */
  deleteAllByKeyword(keyword) {
    return new Promise((resolve, reject) => {
      let genericCacheKey = this._getCacheKey({ key: keyword })
      try {
        this.scanRedis({
          args: ['MATCH', `*${genericCacheKey}*`, 'COUNT', Number.MAX_SAFE_INTEGER],
          onData: (key) => {
            this._deleteByKey(key)
          },
          onEnd: (err) => {
            if (err) {
              console.warn(err.message)
              return reject(err)
            } else {
              return resolve()
            }
          },
        })
      } catch (err) {
        console.warn(err.message)
        reject(err)
      }
    })
  }

  /**
	 *
	 * @param {{
		key: string,
		currentUserId: ?string,
	 * }} config
	 */
  _get(data) {
    return this._getByKey(this._getCacheKey(data))
  }

  /**
	 *
	 * @param {{
		key: string,
		currentUserId: ?string,
	 * }} config
	 */
  _getJson(data) {
    return this._get(data).then((value) => JSON.parse(value))
  }

  set() {
    throw new Error('Subclass must implement this method')
  }

  get() {
    throw new Error('Subclass must implement this method')
  }

  delete() {
    throw new Error('Subclass must implement this method')
  }

  setJson() {
    throw new Error('Subclass must implement this method')
  }

  getJson() {
    throw new Error('Subclass must implement this method')
  }

  scanRedis(opts) {
    return new redisScanner.Scanner(this.cacheManager.redisClient, 'SCAN', null, opts).start()
  }

  static createCachePrefix({ typePrefix, typeKey, deployKey }) {
    const deployTypeKey = `${typeKey}_${deployKey}`
    return `<${tag.typePrefix}>${typePrefix}<|${tag.typePrefix}><${tag.typeKey}>${deployTypeKey}<|${type.typeKey}>`
  }
}

module.exports = BaseCache
