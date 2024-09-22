const fs = require('node:fs')

const result = {}
const d0 = JSON.parse(Buffer.from(fs.readFileSync('source_a.json')).toString('utf8'))
const d1 = JSON.parse(Buffer.from(fs.readFileSync('source_b.json')).toString('utf8'))

result.a = compare(d0, d1)
result.b = compare(d1, d0)

fs.writeFileSync('comparison.json', JSON.stringify(result,' ',2))
console.log('comparison generated and saved')

function compare(a, b) {
  const result = {files:[],folders:[],folderMaps:[]}
  for (const map in a.folderMap) {
    if (!b.folderMap[map]) {
      const folder = a.folders.find(x => x.id == a.folderMap[map].id)
      const record = {
        parthArr: folder.pathArr,
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
      const record = {
        parthArr: file.pathArr,
        created: file.created,
      }
      result.files.push(record)
    }
  }
  return result
}
