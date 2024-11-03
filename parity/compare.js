const fs = require('node:fs')

/*
const result = {}
const d0 = JSON.parse(Buffer.from(fs.readFileSync('buf_bc.json')).toString('utf8'))
const d1 = JSON.parse(Buffer.from(fs.readFileSync('sdc_bc.json')).toString('utf8'))

result.a = compare(d0, d1)
result.b = compare(d1, d0)

fs.writeFileSync('comparison.json', JSON.stringify(result,' ',2))
console.log('comparison generated and saved')
*/

if (!process.env.NAME_0?.length) { console.log(`NAME_0 var required`);return }
if (!process.env.NAME_1?.length) { console.log(`NAME_1 var required`);return }
const source0 = JSON.parse(Buffer.from(fs.readFileSync(process.env.NAME_0)).toString('utf8'))
const source1 = JSON.parse(Buffer.from(fs.readFileSync(process.env.NAME_1)).toString('utf8'))
if (!fs.existsSync(source0.baseDir)) {
  console.log(`SOURCE '${source0.baseDir}' from file '${process.env.NAME_0}' does not exist`)
  return
}
if (!fs.existsSync(source1.baseDir)) {
  console.log(`SOURCE '${source1.baseDir}' from file '${process.env.NAME_1}' does not exist`)
  return
}
console.log(source0.baseDir, source1.baseDir)
const result = {
  applyDate: null,
  a: {
    sourcePath: source0.baseDir,
    mapFileName: process.env.NAME_0,
    ...compare(source0, source1),
  },
  b: {
    sourcePath: source1.baseDir,
    mapFileName: process.env.NAME_1,
    ...compare(source1, source0),
  }
}
fs.writeFileSync('comparison.json', JSON.stringify(result,' ',2))

function compare(a, b) {
  const result = {
    files:[],
    folders:[],
    folderMaps:[],
  }
  for (const map in a.folderMap) {
    if (!b.folderMap[map]) {
      const folder = a.folders.find(x => x.id == a.folderMap[map].id)
      // lets ignore child folders of parent folders intended to be created in this process. this is
      // single purpose copy, not for reporting so no need to know child folders when the parent will
      // create the child regardless
      if (result.folders.find(x => x.pathArr.length === 1 && x.pathArr[0] === folder.pathArr[0])) { continue }
      const record = {
        pathArr: folder.pathArr,
        created: folder.created,
      }
      result.folders.push(record)
      result.folderMaps.push(map)
    }
  }
  for (const map in a.fileMap) {
    if (!b.fileMap[map]) {
      // ignore files in missing folders. the idea is to add folder so next level can appear, otherwise it
      // can get EXTREMELY noisy
      if (result.folderMaps.find(x => map.startsWith(x))) { continue }

      const file = a.files.find(x => x.id == a.fileMap[map].id)
      // ignore m3d files during this debug
      //if (map.endsWith('.m3d')) { continue }
      const record = {
        pathArr: file.pathArr,
        created: file.created,
      }
      result.files.push(record)
    }
  }
  return result
}
