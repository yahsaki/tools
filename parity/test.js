const path = require('node:path')
//const util = require('./util')
const fs = require('node:fs')
const { createHash, randomUUID } = require('node:crypto')
const hash = createHash('sha256')
const isWin = process.platform === 'win32'
const separator = '~~'
/*
  change ids to UUID and change path to array of strings. doing this so we can compare windows
  to linux paths easily(OS agnostic for the most part)
  TODO
    - handle different cased extensions, .png and .PNG would fail a string comparison
*/
walk('C:\\Users\\admin\\Documents')
async function walk(dir) {
  const dirsToRead = [dir]
  const response = {
    baseDir: dir,
    os: 'win',
    createDate: new Date().toISOString()
    files: [],
    folders: [],
    fileMap: {},
    folderMap: {},
  }

  // zeroeth read all dirs/files
  while (dirsToRead.length) {
    const parentRef = dirsToRead[0]
    const parentStats = fs.statSync(parentRef)

    if (!parentStats.isDirectory()) {
      // error
      continue
    }

    let readDirRes
    try {
      readDirRes = fs.readdirSync(parentRef)
    }
    catch(err) {
      if (err?.code === 'EPERM') {
        dirsToRead.splice(0, 1)
        continue
      }
      throw err
    }
    console.log(readDirRes)
    for (let i = 0; i < readDirRes.length; i++) {
      const objName = readDirRes[i]
      const objPath = path.join(parentRef, objName)
      const pathObj = path.parse(objPath)
      console.log('objPath', objPath)
      const s = fs.statSync(objPath)
      if (s.isDirectory(objPath)) {
        const folder = {
          id: randomUUID(),
          type: 'folder',
          pathArr: arrayifyPath(objPath.split(dir)[1]),
          created: new Date(s.birthtime),
          children: []
        }

        const parentFolderArrayifiedPath = arrayifyPath(pathObj.dir.split(dir)[1])
        if (parentFolderArrayifiedPath.length) {
          const pfidObj = response.folderMap[parentFolderArrayifiedPath.join(separator)]
          if (pfidObj) {
            //const pf = response.folders.find(x => x.id === pfidObj.id)
            folder.parentId = pfidObj.id
          }
        }

        const mapIdentifier = folder.pathArr.join(separator)
        if (response.folderMap[mapIdentifier]) {
          throw Error(`folder '${objPath}' already parsed and we should not have duplicate folder names`)
        }
        response.folderMap[mapIdentifier] = {id:folder.id}

        response.folders.push(folder)
        dirsToRead.push(objPath)
      } else if (s.isFile()) {
        if (objName === 'desktop.ini') { continue }
        // if (util.isFileIgnorable()) continue
        const pathObj = path.parse(objPath)
        const file = {
          //parentId, // top level files wont have a parent in this structure... I think
          id: randomUUID(),
          pathArr: arrayifyPath(objPath.split(dir)[1]),
        }

        const mapIdentifier = file.pathArr.join(separator)
        response.fileMap[mapIdentifier] = {id:file.id}
        response.files.push(file)

        const parentFolderArrayifiedPath = arrayifyPath(pathObj.dir.split(dir)[1])
        if (parentFolderArrayifiedPath.length) {
          const pfidObj = response.folderMap[parentFolderArrayifiedPath.join(separator)]

          if (pfidObj) {
            const pf = response.folders.find(x => x.id === pfidObj.id)
            file.parentId = pf.id
            pf.children.push(file)
          }
        }
      }
    }


    if (dirsToRead.length) {
      const obj = dirsToRead.splice(0, 1)
    }
  }

  // first generate a hash map of files
  fs.writeFileSync('data.json', JSON.stringify(response,' ',2))
  console.log(`reading ${response.files.length} files`)
  process.exit()
  // how about we make this toggle-able?
  const hashMapFiles = true // TODO: make this a toggle
  if (!hashMapFiles) return
  for (let i = 0; i < response.files.length; i++) {

  }

  console.log('all dirs read')

  return response
}

function arrayifyPath(dir) {
  const arr = []
  if (!dir?.length) return arr
  if (isWin) {
    const parts = dir.split('\\')
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()
      if (part.length) arr.push(part)
    }
  }
  return arr
}

async function scan() {
  const scanResults = {
    start:new Date(),
    source: {log:null,files:0,folders:0,data:0},
    target: {log:null,files:0,folders:0,data:0},
    summary:null,
  }
  console.log(__dirname)
  const sourceRes = await util.walk(path.join(__dirname, 'testing', 'base_source'), 'source')
}
