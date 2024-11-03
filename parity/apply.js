const fs = require('node:fs')
const path = require('node:path')
const readline = require('readline')
rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const data = JSON.parse(Buffer.from(fs.readFileSync('comparison.json').toString('utf8')))

if (data.applyDate) {
  console.log(`this map between '${data.a.sourcePath}' and '${data.b.sourcePath}' has already been applied on '${data.applyDate}'`)
  process.exit()
}

let message = `${data.a.files.length} files and ${data.a.folders.length} folders will be added to '${data.b.sourcePath}'.\n`
message += `${data.b.files.length} files and ${data.b.folders.length} folders will be added to '${data.a.sourcePath}'.\n`
message += 'do you approve of this action?\n>'
rl.question(message,(line)=>{
  if (!line.length) process.exit()
  if (line.toLowerCase() === 'y' || line.toLowerCase() === 'yes') apply()
  process.exit()
})

function apply() {
  console.log('applying stuff')
  // TODO: copy files/folders(apply)
  // a to b
  const totalActions = data.a.files.length + data.a.folders.length + data.b.files.length + data.b.folders.length
  let executedActions = 0
  for (let i = 0; i < data.a.files.length; i++) {
    // if the folder doesnt already exist an issue occurred earlier in the process
    const file = data.a.files[i]
    const source = path.join(data.a.sourcePath, ...file.pathArr)
    const destination = path.join(data.b.sourcePath, ...file.pathArr)
    fs.copyFileSync(source, destination)
    executedActions += 1
    console.log(`${executedActions}/${totalActions} - file copied: ${source} -> ${destination}`)
  }
  for (let i = 0; i < data.a.folders.length; i++) {
    const folder = data.a.folders[i]
    const source = path.join(data.a.sourcePath, ...folder.pathArr)
    const destination = path.join(data.b.sourcePath, ...folder.pathArr)
    console.log(`${executedActions}/${totalActions} - copying folder: ${source} -> ${destination}`)
    fs.cpSync(source, destination, {recursive:true,preserveTimestamps:true})
    executedActions += 1
    console.log(`${executedActions}/${totalActions} - folder copied\n`)
  }
  // b to a
  for (let i = 0; i < data.b.files.length; i++) {
    const file = data.b.files[i]
    const source = path.join(data.b.sourcePath, ...file.pathArr)
    const destination = path.join(data.a.sourcePath, ...file.pathArr)
    fs.copyFileSync(source, destination)
    executedActions += 1
    console.log(`${executedActions}/${totalActions} - file copied: ${source} -> ${destination}`)
  }
  for (let i = 0; i < data.b.folders.length; i++) {
    const folder = data.b.folders[i]
    const source = path.join(data.b.sourcePath, ...folder.pathArr)
    const destination = path.join(data.a.sourcePath, ...folder.pathArr)
    console.log(`${executedActions}/${totalActions} - copying folder: ${source} -> ${destination}`)
    fs.cpSync(source, destination, {recursive:true,preserveTimestamps:true})
    executedActions += 1
    console.log(`${executedActions}/${totalActions} - folder copied\n`)
  }

  data.applyDate = new Date().toISOString()
  fs.writeFileSync('comparison.json', JSON.stringify(data, ' ',2))
  console.log('operation complete')
}
