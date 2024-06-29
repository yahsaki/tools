const p = require('process')
const readline = require('readline')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const spawn = require('child_process').spawn;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const api = {
  print: (message) => {
    console.clear()
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(message)
  },
  // this function is beyond ridiculous. use exponents for shit sake
  convertBytesToHumanReadable: (bytes) => {
    if (bytes > 1024*1024*1024*1024) {
      return `${(bytes/1024/1024/1024/1024).toFixed(2)}TB`
    }if (bytes > 1024*1024*1024) {
      return `${(bytes/1024/1024/1024).toFixed(2)}GB`
    } else if (bytes > 1024*1024) {
      return `${Math.round(bytes/1024/1024)}MB`
    } else if (bytes > 1024) {
      return `${Math.round(bytes/1024)}KB`
    } else {
      return `${bytes}B`
    }
  },
  getRandomInt: (max) => {
    return Math.floor(Math.random() * max)
  },
  // this goes from :60 to 1:01... subpar performance, way too insignificant to fix
  getElapsedTime: (start) => {
    const seconds = Math.round((new Date() - start)/1000)
    if (seconds > 60) {
      const change = seconds % 60
      return `${Math.round(seconds/60)}:${change < 10 ? "0" : ""}${change}`
    } else {
      return `:${seconds < 10 ? "0" : ""}${seconds}`
    }
  },
  plural: ln => ln === 1 ? '' : 's',
  askQuestion: q => {
    const promise = new Promise(resolve => {
      rl.question(q, (answer) => {
        resolve(answer)
      })
    })
    return promise;
  },
  delay: ms =>
    new Promise(resolve =>
      setTimeout(() => resolve(), ms)),
  delete: async (type, items, targetDir, existingLog = null) => {
    let log
    if (items.length) {
      for (let i = 0; i < items.length; i++) {
        const fp = path.join(targetDir, items[i])
        await fs.remove(fp)
        await delay(100)
        log = `${existingLog != null ? existingLog+'\n' : ''}${i+1}/${items.length} ${type}s ${chalk.red('deleted')} '${fp}'`
        api.print(log)
      }
    } else {
      log = `${existingLog != null ? existingLog+'\n' : ''}no ${type}s to delete`
      api.print(log)
    }
    return log
  },
  crupdate: async (type, intention, items, sourceDir, targetDir, existingLog = null) => {
    let log
    if (items.length) {
      for (let i = 0; i < items.length; i++) {
        const sp = path.join(sourceDir, items[i])
        const tp = path.join(targetDir, items[i])
        if (type === 'folder') await fs.ensureDir(tp)
        else {
          await api.copyFile(sp, tp)
          //await fs.copy(sp, tp)
        }
        await api.delay(200)
        log = `${existingLog != null ? existingLog+'\n' : ''}${i+1}/${items.length} ${type}s ${intention}d '${tp}'`
        api.print(log)
      }
    } else {
      log = `${existingLog != null ? existingLog+'\n' : ''}no ${type}s to ${intention}`
      api.print(log)
    }
    return log
  },
  copyFile: (from, to) => {
    const promise = new Promise((resolve, reject) => {
      const p = spawn('cp', [from, to]);
      p.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
      });
      p.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      p.on('close', (code) => {
        if (code === 0) resolve();
        else {
          console.log(`received code ${code} attempting to copy file ${from},${to}`)
          resolve();
        }
      });
    });
    return promise;
  }
}

module.exports = api
