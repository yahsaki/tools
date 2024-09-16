const path = require('path')
const util = require('./util')

scan()
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
