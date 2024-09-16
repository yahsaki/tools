const chalk = require('chalk')
const klaw = require('klaw')
const p = require('process')
const readline = require('readline')

function print(message) {
  console.clear()
  readline.clearLine(process.stdout, 0)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(message)
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

function convertBytesToHumanReadable(bytes) {
  if (bytes > 1024*1024*1024) {
    return {val: (bytes/1024/1024/1024).toFixed(2), name:'GB'}
  } else if (bytes > 1024*1024) {
    return {val: Math.round(bytes/1024/1024), name:'MB'}
  } else if (bytes > 1024) {
    return {val: Math.round(bytes/1024), name:'KB'}
  } else {
    return {val: Math.round(bytes), name:'B'}
  }
}

function getElapsedTime(start) {
  const seconds = Math.round((new Date() - start)/1000)
  if (seconds > 60) {
    const change = seconds % 60
    return `${Math.round(seconds/60)}:${change < 10 ? "0" : ""}${change}`
  } else {
    return `:${seconds < 10 ? "0" : ""}${seconds}`
  }
}

const delay = ms =>
  new Promise(resolve =>
    setTimeout(() => resolve(), ms));

to0()
async function to0() {
  const start = new Date()
  let files = 0
  let folders = 1
  let size = 0
  setInterval(() => {
    files += 1
    if (files % 7 === 0) folders += 1
    size += getRandomInt(files % 13 === 0 ? 500000 : 10000000)
    const readableSize = convertBytesToHumanReadable(size)
    print(`${getElapsedTime(start)} scanning source directory
      files: ${files}, folders: ${folders}, data: ${readableSize.val}${readableSize.name}`)
  }, 100)
}

//getElapsed()
function getElapsed() {
  console.log(getS(5))
  console.log(getS(65))
  console.log(getS(120))
  function getS(seconds) {
    if (seconds > 60) {
      const change = seconds % 60
      return `${Math.round(seconds/60)}:${change < 10 ? "0" : ""}${change}`
    } else {
      return `:${seconds < 10 ? "0" : ""}${seconds}`
    }
  }
}
