const chalk = require('chalk')
const klaw = require('klaw')
const rl = require('readline')
const util = require('./util.js')
const fs = require('fs-extra')
const path = require('path')
/*
  TODO: add smartness, as in:
    - only update if older
    - dont update if newer(same shit as above)
    - maybe have size checks, like if something shrunk, ignore(I dont see the use case)
    - do not update a target if source is empty!!!!! auto reject
    - etc
*/

const sourceDir = process.env.SOURCEDIR
const targetDir = process.env.TARGETDIR
const scanResults = {
  start:new Date(),
  source: {log:null,files:0,folders:0,data:0},
  target: {log:null,files:0,folders:0,data:0},
  summary:null,
}
const applyResults = {
  start:null,
  end:null,
  actions: [], // currently not recording actions
}
;(async () => {
  if (!sourceDir || !targetDir) {
    console.log('please provide a source directory(SOURCEDIR) and target directory(TARGETDIR) env vars, onegaishimasu')
    process.exit(0)
  }
  // its not right to pass params to a function named this way, clean it up
  const sourceRes = await walk(sourceDir, 'source')
  const targetRes = await walk(targetDir, 'target', scanResults.source.log)
  const manifest = generateManifest(sourceRes, targetRes)
  // move this summary printing to... elsewhere
  scanResults.summary = `${scanResults.source.log}
---
${scanResults.target.log}
---
${chalk.underline('Summary')}
${manifest.folders.create.length} folder${util.plural(manifest.folders.create.length)} to ${chalk.green('create')}
${manifest.folders.delete.length} folder${util.plural(manifest.folders.delete.length)} to ${chalk.red('delete')}
${manifest.files.update.length} file${util.plural(manifest.files.update.length)} to ${chalk.yellow('update')} (${util.convertBytesToHumanReadable(manifest.stats.updateSize)})
${manifest.files.create.length} file${util.plural(manifest.files.create.length)} to ${chalk.green('create')} (${util.convertBytesToHumanReadable(manifest.stats.createSize)})
${manifest.files.delete.length} file${util.plural(manifest.files.delete.length)} to ${chalk.red('delete')} (${util.convertBytesToHumanReadable(manifest.stats.deleteSize)})
`
util.print(scanResults.summary)
if (!manifest.folders.create.length && !manifest.folders.delete.length && !manifest.files.update.length && !manifest.files.create.length && !manifest.files.delete.length) {
  util.print(scanResults.summary+'\nNothing to do, you are in parity!\n')
  process.exit(0)
}
// save data for debugging
await fs.writeFileSync('output.json', JSON.stringify({scanResults,manifest},' ',2),{encoding:'utf8'})
const answer = await util.askQuestion('Would you like to apply?(Y/n)')
if (answer !== 'n') {
  // GO!
  await apply(manifest)
  await fs.writeFileSync('output.json', JSON.stringify({applyResults,scanResults,manifest},' ',2),{encoding:'utf8'})
  if (applyResults.error) {
    console.error('error during apply', applyResults.error)
  } else {
    console.log(`\nPairing completed in ${util.getElapsedTime(applyResults.start)}. check output log written to this dir`)
  }
}
process.exit(0)
})()

// Honestly, we should check if the file(s) is(are) in a folder that will be
// deleted, but I dont care enough to do that at the moment. I'm building this
// to keep extremely similar folders up to date with each other
async function apply(manifest) {
  applyResults.start = new Date()
  try {
    // delete files
    let log = await util.delete('file', manifest.files.delete, targetDir)
    // delete folders
    log = await util.delete('folder', manifest.folders.delete, targetDir, log)
    // create folders
    log = await util.crupdate('folder', 'create', manifest.folders.create, sourceDir, targetDir, log)
    // create files
    log = await util.crupdate('file', 'create', manifest.files.create, sourceDir, targetDir, log)
    // update existing
    log = await util.crupdate('file', 'update', manifest.files.update, sourceDir, targetDir, log)
    applyResults.log = log
  } catch(err) {
    // stop on the first error. GOOD LUCK WHOEVER YOU ARE!
    applyResults.error = err
  } finally {
    applyResults.end = new Date()
    return
  }
}

function generateManifest(sourceRes, targetRes) {
  // move this object to utils
  const manifest = {
    folders: {
      create: [],
      delete: []
    },
    files: {
      update: [],
      create: [],
      delete: [],
    },
    stats: {
      updateSize: 0,
      createSize: 0,
      deleteSize: 0,
    }
  }

  let targetKeys = Object.keys(targetRes.folders)
  for (let key in sourceRes.folders) {
    if (key === sourceDir || key === targetDir) continue
    if (!targetRes.folders[key]) manifest.folders.create.push(key)

    const index = targetKeys.findIndex(x => x === key)
    if (index > -1) targetKeys.splice(index,1)
  }
  for (let i = 0; i < targetKeys.length; i++) {
    manifest.folders.delete.push(targetKeys[i])
  }

  targetKeys = Object.keys(targetRes.files)
  for (let key in sourceRes.files) {
    if (!targetRes.files[key]) {
      manifest.files.create.push(key) // create!
      manifest.stats.createSize += sourceRes.files[key].size
    }
    else {
      // the modified/access/created times will always be different, especially
      // if we just ran the damn code to bring it up to parity. In the future,
      // add a flag to check against times, but the chances are they all will be
      // different, be warned
      if (sourceRes.files[key].size !== targetRes.files[key].size) {
        manifest.files.update.push(key) // update!
        manifest.stats.updateSize += sourceRes.files[key].size
      }
    }

    const index = targetKeys.findIndex(x => x === key)
    if (index > -1) targetKeys.splice(index,1)
  }
  // delete!
  for (let i = 0; i < targetKeys.length; i++) {
    manifest.files.delete.push(targetKeys[i])
    manifest.stats.deleteSize += targetRes.files[targetKeys[i]].size
  }
  return manifest
}

function walk(dir, type, log) {
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
      const byteString = util.convertBytesToHumanReadable(scanResults[type].data)
      scanResults[type].log = `${util.getElapsedTime(scanResults.start)} scanning ${type} directory(${chalk.italic(dir)})
files: ${scanResults[type].files}, folders: ${scanResults[type].folders}, data: ${byteString}`
      util.print(`${log != null ? log+'\n---\n' : ''}${scanResults[type].log}`)
    })
    .on('end', () => resolve(res))
  })
  return promise;
}
