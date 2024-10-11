const { spawn } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const { randomUUID } = require('node:crypto')

const delay = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

// TODO: make this a json file
const data = require('./data_1')

/*
  convert raw video files into gifs and webms
*/
;(async () => {
  const filePaths = []

  const status = { files: 0, jobs: 0, }
  for (let key in data.files) {
    filePaths.push(key)
    status.jobs += data.files[key].jobs.length
  }
  status.files = filePaths.length
  console.log(status)
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i]
    const fileObj = path.parse(filePath)
    const fileId = randomUUID()
    if (!fs.existsSync(filePath)) {
      throw Error(`invalid file path '${filePath}'`)
    }
    console.log(filePath)

    for (let j = 0; j < data.files[filePath].jobs.length; j++) {
      const job = data.files[filePath].jobs[j]
      const jobId = randomUUID()
      const jobDir = path.join(data.baseOutputFolder, fileId, jobId)
      try {
        fs.mkdirSync(jobDir, {recursive: true})
      } catch (err) {
        if (err.code !== 'EEXIST') { throw err }
      }
      await delay(1000)

      console.log(job)

      const baseJobFileName = `base_${job.name}`
      const baseJobFilePath = path.join(jobDir, `${baseJobFileName}${fileObj.ext}`)
      console.log(baseJobFilePath)

      // STEP #0: Create Base Job File
      let args = [],jobFileName='',jobFilePath='',code=0
      if (job.from) {args.push('-ss');args.push(job.from)}
      if (job.to){args.push('-to');args.push(job.to)}
      args.push('-i');args.push(filePath)
      args.push('-y');args.push(baseJobFilePath)
      console.log(args)

      code = await invoke('ffmpeg', args)
      if (code !== 0) {
        failDuringJob({status,job,filePath,code,message:'failed to create base file'})
      }
      // ensure file exists
      await delay(1000)
      if (!fs.existsSync(baseJobFilePath)) {
        failDuringJob({status,job,filePath,code,message:'created base file successfully but doesnt exist on disk'})
      }

      //console.log('here so far, SUCCESS', baseJobFilePath)
      //process.exit()

      if (job.webm) {
        // no point in doing webms outside of vp9 tbh
        let webmFilePath
        webmFilePath = await createWebm({status,job,dir:jobDir,scale:{x:80*16,y:80*9},baseFilePath:baseJobFilePath})
        wembFilePath = await createWebm({status,job,dir:jobDir,scale:{x:45*16,y:45*9},baseFilePath:baseJobFilePath})
        wembFilePath = await createWebm({status,job,dir:jobDir,scale:{x:20*16,y:20*9},baseFilePath:baseJobFilePath})
      }
      if (job.gif) {
        let gifFilePath
        gifFilePath = await createGif({status,job,dir:jobDir,scale:320,fps:10,baseFilePath:baseJobFilePath})
        gifFilePath = await createGif({status,job,dir:jobDir,scale:320,fps:30,baseFilePath:baseJobFilePath})
        gifFilePath = await createGif({status,job,dir:jobDir,scale:540,fps:10,baseFilePath:baseJobFilePath})
        gifFilePath = await createGif({status,job,dir:jobDir,scale:540,fps:30,baseFilePath:baseJobFilePath})
        gifFilePath = await createGif({status,job,dir:jobDir,scale:720,fps:10,baseFilePath:baseJobFilePath})
        gifFilePath = await createGif({status,job,dir:jobDir,scale:720,fps:30,baseFilePath:baseJobFilePath})
      }
      if (job.vp9) {
        let vp9FilePath
        vp9FilePath = await createVp9({status,job,dir:jobDir,scale:{x:45*16,y:45*9},fps:30,baseFilePath:baseJobFilePath})
      }
    }
  }

  console.log('everything c omplete')
})()

async function createVp9(params) {
  const status = params.status
  const job = params.job
  const dir = params.dir
  const scale = params.scale //{x:1920,y:1080}
  const fps = params.fps
  const baseFilePath = params.baseFilePath

  let fileName = `${job.name}_${scale.x}x${scale.y}_vp9.webm`
  let filePath = path.join(dir, fileName)
  const code = await invoke('cmd.exe', ['/c', 'vp9.bat', baseFilePath, filePath, `${scale.x}`])
  // not sure if code works yet
  return
}

async function createWebm(params) {
  const status = params.status
  const job = params.job
  const dir = params.dir
  const scale = params.scale //{x:1920,y:1080}
  const fps = params.fps
  const baseFilePath = params.baseFilePath

  let args = []
  let fileName = `${job.name}_${scale.x}x${scale.y}.webm`
  let filePath = path.join(dir, fileName)
  args.push('-i');args.push(baseFilePath)
  args.push('-vf');args.push(`scale=${scale.x}:${scale.y}`)
  args.push('-y');args.push(filePath)
  code = await invoke('ffmpeg', args)
  if (code !== 0) {
    failDuringJob({status,job,baseFilePath,code,message:`failed to create ${scale.x}x${scale.y} webm`})
  }
  await delay(1000)
  if (!fs.existsSync(filePath)) {
    failDuringJob({status,job,baseFilePath,code,message:`created ${scale.x}x${scale.y} webm successfully but doesnt exist on disk`})
  }
  const baseWebmFilePath = filePath

  args = []
  fileName = `${job.name}_${scale.x}x${scale.y}_no_audio.webm`
  filePath = path.join(dir, fileName)
  args.push('-i');args.push(baseWebmFilePath)
  args.push('-c');args.push('copy');args.push('-an')
  args.push('-y');args.push(filePath)
  code = await invoke('ffmpeg', args)
  if (code !== 0) {
    failDuringJob({status,job,baseFilePath,code,message:`failed to create no audio webm ${fileName}`})
  }
  await delay(1000)
  if (!fs.existsSync(filePath)) {
    failDuringJob({status,job,baseFilePath,code,message:`created no audio webm ${fileName} successfully but doesnt exist on disk`})
  }

  return filePath
}

async function createGif(params) {
  const status = params.status
  const job = params.job
  const dir = params.dir
  const scale = params.scale
  const fps = params.fps
  const baseFilePath = params.baseFilePath

  const args = []
  const fileName = `${job.name}_${scale}_${fps}FPS.gif`
  const filePath = path.join(dir, fileName)
  args.push('-i');args.push(baseFilePath)
  args.push('-vf');args.push(`fps=${fps},scale=${scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`)
  args.push('-loop');args.push('0')
  args.push('-y');args.push(filePath)
  code = await invoke('ffmpeg', args)
  if (code !== 0) {
    failDuringJob({status,job,baseFilePath,code,message:`failed to create ${scale} ${fps}FPS gif`})
  }
  await delay(1000)
  if (!fs.existsSync(filePath)) {
    failDuringJob({status,job,baseFilePath,code,message:`created ${scale} ${fps}FPS file successfully but doesnt exist on disk`})
  }
  return filePath
}

function failDuringJob(args) {
  const message = args.message
  const code = args.code
  const status = args.status
  const baseFilePath = args.baseFilePath
  const job = args.job
  console.log(`on file '${baseFilePath}', job '${job.name}'`)
  if (message) console.log(message)
  process.exit()
}

async function invoke(cmd, args) {
  const promise = new Promise((resolve, reject) => {
    const p = spawn(cmd, args)
    p.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })
    p.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
    })
    p.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
      resolve(code)
    })
  })
  return promise
}
