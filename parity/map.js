const path = require('node:path')
//const util = require('./util')
const fs = require('node:fs')
const { createHash, randomUUID } = require('node:crypto')
const hash = createHash('sha256')
const isWin = process.platform === 'win32'
const separator = '~~'
/*
  this fn expects these env variables
  SOURCE: directory of files to map
  NAME: name for the file

  the resulting data's filepaths are OS agnosting intentionally

  TODO
    - handle different cased extensions, .png and .PNG would fail a string comparison
*/
if (!process.env.SOURCE?.length) { console.log(`SOURCE var required`);return }
if (!process.env.NAME?.length) { console.log(`NAME var required`);return }
if (!fs.existsSync(process.env.SOURCE)) {
  console.log(`SOURCE '${process.env.SOURCE}' is not a valid path`)
  return
}
// TODO: I guess alphanumeric plus - _ are the only valid file name chars? for now just self
// govern that shit
map(process.env.SOURCE, process.env.NAME)
async function map(dir, resultFileName) {
  const dirsToRead = [dir]
  const response = {
    baseDir: dir,
    os: process.platform,
    createDate: new Date().toISOString(),
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

    for (let i = 0; i < readDirRes.length; i++) {
      const objName = readDirRes[i]
      const objPath = path.join(parentRef, objName)
      const pathObj = path.parse(objPath)
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
            const pf = response.folders.find(x => x.id === pfidObj.id)
            folder.parentId = pf.id
            pf.children.push(folder)
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
  fs.writeFileSync(`${resultFileName}.json`, JSON.stringify(response,' ',2))

  //console.log(`reading ${response.files.length} files`)
  // how about we make this toggle-able?
  //const hashMapFiles = true // TODO: make this a toggle
  //if (!hashMapFiles) return
  //for (let i = 0; i < response.files.length; i++) {}

  console.log('subete owari')
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
