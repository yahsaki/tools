const fs = require('node:fs')
const path = require('node:path')

// dont even need async
// this couldve been a bat file but I plan on implementing more features that are a pain with scripting
;(async () => {
  const filePaths = fs.readdirSync('./')
  let datajs = '//This file is auto generated\nconst data = '
  const files = []
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i]
    const obj = path.parse(filePath)
    if (obj.ext === '.mp4') { files.push(filePath) }
  }
  datajs += JSON.stringify(files, ' ', 2)
  fs.writeFileSync('data.js', datajs)
  console.log(`${files.length} files set`)
})()