const bl = require('bl')
const through = require('through2')
const levelup = require('levelup')
const once = require('once')
const createHasher = require('hashes-stream')

const proxy = () => {
  return through(function (chunk, enc, cb) {
    this.push(chunk)
    cb()
  })
}

class LevelLucuass {
  constructor (name, leveldown, algo='sha256', _createHasher=createHasher) {
    if (!leveldown) {
      throw new Error('leveldown is a required argument.')
    }
    this.levelup = levelup(name, {valueEncoding: 'binary', db: leveldown})
    this._createHasher = _createHasher
    this._algo = algo
  }
  hash (value, cb) {
    let stream
    if (Buffer.isBuffer(value)) {
      stream = bl()
      process.nextTick(() => {
        stream.write(value)
        stream.end()
      })
    } else if (value.readable) {
      stream = value
    } else {
      throw new Error("Invalid type.")
    }
    let hasher = this._createHasher(this._algo, cb)
    stream.pipe(hasher)
  }
  set (value, cb) {
    cb = once(cb)
    if (Buffer.isBuffer(value)) {
      let hasher = this._createHasher(this._algo, (err, hash) => {
        if (err) return cb(err)
        this.levelup.put(hash, value)
      })
      hasher.write(value)
      hasher.end()
    } else if (value.readable) {
      let hash
      let buff
      let finish = () => this.levelup.put(hash, buff, (err) => cb(err, hash))
      value.pipe(bl((err, _buff) => {
        if (err) return cb(err)
        buff = _buff
        if (hash) finish()
      }))
      value.pipe(this._createHasher(this._algo, (err, _hash) => {
        if (err) return cb(err)
        hash = _hash
        if (buff) finish()
      }))
    } else {
      throw new Error("Invalid type.")
    }
  }
  getBuffer (hash, cb) {
    console.error('getBuffer', hash)
    this.levelup.get(hash, cb)
  }
  getStream (hash) {
    let stream = proxy()
    this.levelup.get(hash, (err, buffer) => {
      if (err) stream.emit('error', err)
      stream.write(buff)
      stream.end()
    })
    return stream
  }
}

module.exports = (...args) => new LevelLucuass(...args)
