const fs = require('node:fs')
const readline = require('readline')
rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const data = JSON.parse(Buffer.from(fs.readFileSync('comparison.json').toString('utf8')))

if (data.applyDate) {
  console.log(`this map has between '${data.a.sourcePath}' and '${data.b.sourcePath}' has already been applied on '${data.applyDate}'`)
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
  process.exit()
  // TODO: copy files/folders(apply)
}
