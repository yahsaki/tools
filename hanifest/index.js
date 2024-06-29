const fs = require('node:fs')
const path = require('node:path')
/*
 tool takes a DIR param which should just be one letter

 structuring a cmd like 'arg=arg node index.js' does not work in PS and probably cmd either POSs
 TODO
  - print how much disk space is left in output
  - fix that OS check(not sure how just yet)
  - json output. during txt generation, read in json, combine with whats in the current disk, compose so the
    entries say which card they live in. IE, if disk #0 has _managed/docs/linux/linux_administration.pdf and
    disk #1 has _managed/docs/linux/shell_scripting.pdf, the final json output would look something like
    {
      linux: [
        {name:'linux_administration.pdf': disk:'#0'}
        {name:'shell_scripting.pdf': disk:'#1'}
      ]
    }
    cant do object naming since duplication is very likely
    idgaf atm
*/

const validDirs = ['a','b','e','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
const managedDirName = '_managed'
const infoJsonName = 'info.json'

;(async () => {
  // TODO: support linux(lol what a world)
  // doesnt feel right. what if there is a linux distro with 'windows' in the name? lol
  if (!process.env.OS.toLowerCase().includes('windows')) throw Error(`Only windows supported at the moment. didnt setup nix VM yet`)
  const dir = process.env.DIR
  if (!isDirValid(dir)) throw Error(`argument DIR '${dir}' is invalid`)

  const winDir = `${dir.toUpperCase()}:\\`
  const res = fs.readdirSync(winDir)
  if (!isDriveValid(res)) throw Error(`Drive must contain a dir named '${managedDirName}' and a json file named '${infoJsonName}' on root`)

  const infoPath = path.join(winDir, infoJsonName)
  const infoBuf = fs.readFileSync(infoPath)
  let info
  try {
    info = JSON.parse(Buffer.from(infoBuf).toString('utf8'))
  } catch (err) {
    throw Error(`failed to parse json file at 'infoPath'`, err)
  }

  if (!isInfoValid(info)) throw Error(`IDK something wrong with the '${infoJsonName}' file's properties`)

  const dirData = getDirData(path.join(winDir, managedDirName))
  console.log(JSON.stringify(dirData,' ',2))
  writeDirData({info,dirData})
})()

function writeDirData(args) {
  const info = args.info
  const data = args.dirData

  const date = new Date()
  // might need to sanitize filename
  const filename = `${info.name}_${date.toISOString().substring(0,10)}.txt`
  let txt = ''
  for (const ci in data.sorted) {
    const cn = data.sorted[ci]
    const category = data.category[cn]
    txt += `${cn.toUpperCase()}\n`

    for (const ei in category.sorted) {
      const en = category.sorted[ei]
      const entry = category.entry[en]
      txt += `  ${en}\n`

      for (const ci in entry.children) {
        const child = entry.children[ci]
        txt += `      ${child}\n`
      }
    }
  }

  fs.writeFileSync(filename, txt)
  return
}
function sortEntries(arg) {
  let sorted = Object.getOwnPropertyNames(arg)
}
function isDirValid(arg) {
  if (typeof arg !== 'string') return false
  if (!arg.length) return false
  return !!~validDirs.indexOf(arg.toLowerCase())
}
function isDriveValid(arg) {
  // we can safely assume at this point we received an array empty or not
  if (!~arg.indexOf(managedDirName)) return false
  if (!~arg.indexOf(infoJsonName)) return false
  return true
}
function isInfoValid(arg) {
  if (!arg.name?.length) return false
  return true
}

function getDirData(dir) {
  const data = {sorted:[],category:{}}
  const tlds = fs.readdirSync(dir)
  console.log(`tld:`, tlds)
  for (const i in tlds) {
    data.category[tlds[i]] = {
      sorted: [],
      entry: {},
    }
  }
  //console.log(data)

  for (const cn in data.category) {
    //console.log(cn)
    const category = data.category[cn]

    const categoryPath = path.join(dir, cn)
    //console.log(categoryPath)

    const entries = fs.readdirSync(categoryPath)
    //console.log(entries)

    for (let i in entries) {
      const en = entries[i]
      const entryPath = path.join(categoryPath, en)
      //console.log(entryPath)
      const children = fs.readdirSync(entryPath, {withFileTypes:true})
      //category.entry[en] = { children: children.filter(x => !~x.name?.indexOf('.')).map(x => { if (x) { return x.name } }) }
      category.entry[en] = { children: children.map(x => { if (x) { return x.name } }).sort() }
      //console.log(category.entry[en])
    }
  }
  // sort
  data.sorted = Object.getOwnPropertyNames(data.category).sort()
  for (const cn in data.category) {
    data.category[cn].sorted = Object.getOwnPropertyNames(data.category[cn].entry).sort()
    // sorting children during initial creation for now. when we add file data will most likely move that to here, maybe
    //for (const en in data.category[cn].entry) {
      //console.log(data.category[cn].entry[en], en)
      //data.category[cn].entry[en].children.sort()
      //for (const en in data.category[cen].entry) {
      //  data.category[cen].entry[en].children.sort()
      //}
    //}
  }
  return data

  console.log(JSON.stringify(data,' ',2))
  const jsonOutput = {}

  let textOutput = ''
  for (const cn in data.category) {
    const category = data.category[cn]
    textOutput += `${cn.toUpperCase()}\n`

    for (const en in category.entry) {
      const entry = category.entry[en]
      textOutput += `  ${en}\n`

      for (const ci in entry.children) {
        const child = entry.children[ci]
        textOutput += `      ${child}\n`
      }
    }
  }
  fs.writeFileSync('textOutput.txt', textOutput)
}
