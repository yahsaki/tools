const p = require('process')
const readline = require('readline')
const fs = require('fs')
const klaw = require('klaw')
const path = require('path')
const chalk = require('chalk')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const api = {
  print: (message) => {
    console.clear()
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(message)
  },
  convertBytesToHumanReadable: (bytes) => {
    if (bytes > 1024*1024*1024*1024) {
      return `${(bytes/1024/1024/1024/1024).toFixed(2)}TB`
    }if (bytes > 1024*1024*1024) {
      return `${(bytes/1024/1024/1024).toFixed(2)}GB`
    } else if (bytes > 1024*1024) {
      return `${Math.round(bytes/1024/1024)}MB`
    } else if (bytes > 1024) {
      return `${Math.round(bytes/1024)}KB`
    } else {
      return `${bytes}B`
    }
  },
  plural: ln => ln === 1 ? '' : 's',
  askQuestion: q => {
    const promise = new Promise(resolve => {
      rl.question(q, (answer) => {
        resolve(answer)
      })
    })
    return promise
  },
  delay: ms =>
    new Promise(resolve =>
      setTimeout(() => resolve(), ms)),
  walk: function(dir, type, log) {
    const promise = new Promise(resolve => {
      const res = {files:{},folders:{}}
      klaw(dir)
      .on('data', item => {
        const key = item.path.replace(dir, '')
        if (item.stats.isDirectory()) {
          scanResults[type].folders += 1
          res.folders[key] = {
            created: new Date(item.stats.birthtime),
          }
        } else {
          scanResults[type].files += 1
          scanResults[type].data += item.stats.size
          res.files[key] = {
            path: item.path,
            size: item.stats.size,
            atime: new Date(item.stats.atime), // last accessed
            mtime: new Date(item.stats.mtime), // last modified
            ctime: new Date(item.stats.ctime), // created?
            created: new Date(item.stats.birthtime),
          }
        }
        const byteString = this.convertBytesToHumanReadable(scanResults[type].data)
        scanResults[type].log = `${this.getElapsedTime(scanResults.start)} scanning ${type} directory(${chalk.italic(dir)})
  files: ${scanResults[type].files}, folders: ${scanResults[type].folders}, data: ${byteString}`
        this.print(`${log != null ? log+'\n---\n' : ''}${scanResults[type].log}`)
      })
      .on('end', () => resolve(res))
    })
    return promise
  }
}

module.exports = api
