const fs = require('node:fs')
const path = require('node:path')
const isWin = process.platform === 'win32'

const api = {
  settings: {
    dataFileName: 'data.m3d', // music metadata manager(three M's) data
    localDataFolderName: '_m3_data',
    delimiter: '¦¦',
  },
  template: {
    base: {
      version: '0.0.0',
      createDate: null,
      updateDate: null,
      tracks: [],
      tags:[],
      comments:[],
      history: {tags:[],ratings:[]},
    },
    track: {
      played: false,
      updateDate: null,
      filename: null,
      tags: [],
      comments:[],
      history: {tags:[],ratings:[]},
    }
  },
  delay: ms =>
    new Promise(resolve =>
      setTimeout(() => resolve(), ms)),
  fs: {
    mkdir: (dir) => {
      try {
        fs.mkdirSync(dir, {recursive: true})
      } catch (err) {
        if (err.code !== 'EEXIST') { throw err }
      }
      return
    },
    readJson: (filePath) => {
      if (!filePath?.length) { throw new Error(`readJson: invalid args. expected string path, received '${typeof filePath}'`) }
      let binary
      try {
        // I dont think this is binary... whatever
        binary = fs.readFileSync(filePath)
      } catch(err) {
        return
      }

      if (!binary) { return }
      try {
        return JSON.parse(Buffer.from(binary).toString())
      } catch(err) { throw err }
    },
    writeJson: function(filePath, data, formatted = false) {
      if (!filePath?.length || typeof data !== 'object') {
        throw new Error(`writeJson: invalid args`)
      }
      const parsed = path.parse(filePath)
      //this.fs.mkdir(parsed.dir)
      // other tools seem to add a newline char at the end
      if (formatted) {
        fs.writeFileSync(filePath, JSON.stringify(data,' ',2)) // more readable
      } else {
        fs.writeFileSync(filePath, JSON.stringify(data))
      }
      return
    },
  },
  shuffle: (array) => {
    let currentIndex = array.length, temporaryValue, randomIndex
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
  },
}


module.exports = api
