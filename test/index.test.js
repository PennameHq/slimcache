const packageIndex = require('../index')
const CacheManager = require('../lib/CacheManager')
const helper = require('./helper')()
const { assert } = helper

describe('index', () => {
  it('should be an instance of CacheManager', () => {
    assert.equal(packageIndex, CacheManager)
  })
})
