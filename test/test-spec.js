const spec = require('lucass/lib/test-basics')
const levlucass = require('../')
const inmem = require('memdown')

spec('level', levlucass('test', inmem))
