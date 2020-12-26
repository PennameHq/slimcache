const BaseCache = require('./BaseCache')

class BaseJsonCache extends BaseCache {
  constructor(cacheManager, config) {
    super(cacheManager, config)
    const { key, ttl } = config

    this._prefix = BaseCache.createCachePrefix({
      typePrefix: 'cjson',
      typeKey: key,
    })

    // ttl is in seconds
    this._ttl = ttl || 30
  }

  /**
	 * 
	 * @param {{
		key: string,
		currentUserId: ?string,
		value: any,
	 * }} config
	 */
  set(data) {
    return this._setJson(data)
  }

  /**
	 * 
	 * @param {{
		key: string,
		currentUserId: ?string,
	 * }} config
	 */
  get(data) {
    return super._getJson(data)
  }

  /**
	 * 
	 * @param {{
		key: string,
		currentUserId: ?string,
	 * }} config
	 *
	 */
  delete(data) {
    return super._delete(data)
  }

  /**
	 * 
	 * @param {{
		key: string,
		currentUserId: ?string,
		value: any,
	 * }} config
	 */
  setJson(data) {
    return this.set(data)
  }

  /**
	 * Retrieves cached json
	 * @param {{
		key: string,
		currentUserId: ?string,
		value: any,
	 * }} config
	 */
  getJson(data) {
    return this.get(data)
  }
}

module.exports = BaseJsonCache
