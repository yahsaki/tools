const fs = require('node:fs')
const path = require('node:path')

const validDirs = ['a','b','e','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
const managedDirName = '_managed'
const infoJsonName = 'info.json'
const mediaJsonName = 'media.json'

let mediaObject = {
  general: {
    drive: {
      /*'TGPro-1TB-000': {
        name: 'TGPro-1TB-000',
        date: '<ISOdate>', // created, last updated, whatever
        type: 'media',
        space: {
          total: 953000000,
          used: 900000000,
          free: 53000000,
          freeString: '53GB',
        },
        topLevelFolders: ['anime','manga'],
      },*/
    }
  },
  media: {
    /*anime: [ // sort by name ascending
      {
        folderName: '', // would love to store actual name at some point(reboot manifest)
        drives: {
          'TGPro-1TB-000': {
            usedSpace: 555555,
            usedSpaceString: '555MB',
            files: 12,
            folders: 1,
          }
        },
      }
    ],
    manga: [],*/
  }
}
const myfs = {
  mkdir: (dir) => {
    try {
      fs.mkdirSync(dir, {recursive: true})
    } catch (err) {
      if (err.code !== 'EEXIST') { throw err }
    }
    return
  },
  readJson: (filePath) => {
    if (!filePath?.length) { throw new Error(`readJson: invalid args. expected string path, received '${typeof filePath}'`) }
    let binary
    try {
      // I dont think this is binary... whatever
      binary = fs.readFileSync(filePath)
    } catch(err) {
      return
    }

    if (!binary) { return }
    try {
      return JSON.parse(Buffer.from(binary).toString())
    } catch(err) { throw err }
  },
  writeJson: function(filePath, data, formatted = false) {
    if (!filePath?.length || typeof data !== 'object') {
      throw new Error(`writeJson: invalid args`)
    }
    const parsed = path.parse(filePath)
    //this.fs.mkdir(parsed.dir)
    // other tools seem to add a newline char at the end
    if (formatted) {
      fs.writeFileSync(filePath, JSON.stringify(data,' ',2)) // more readable
    } else {
      fs.writeFileSync(filePath, JSON.stringify(data))
    }
    return
  },
}

;(async () => {
  const homePath = path.join(process.env.HOME, 'Documents', 'mstbu', 'hanifest_output')
  // make this directory if it doesnt exist
  myfs.mkdir(homePath)
  
  // check for existing media json
  const mediaJsonFilePath = path.join(homePath, mediaJsonName)
  if (fs.existsSync(mediaJsonFilePath)) {
    mediaObject = myfs.readJson(mediaJsonFilePath)
  }
  
  // check for assumed drive defaults(very temporary behavior)
  const defaultWorkingPath = 'a:\\'
  if (!fs.existsSync(defaultWorkingPath)) { console.log(`path '${defaultWorkingPath}' does not have a drive mounted`);process.exit() }
  
  const infoJsonPath = path.join(defaultWorkingPath, 'info.json')
  if (!fs.existsSync(infoJsonPath)) { console.log(`no info json located at '${infoJsonPath}'`);process.exit() }
  
  const infoJson = myfs.readJson(infoJsonPath)
  const managedPath = path.join(defaultWorkingPath, '_managed')
  if (!infoJson.name?.length) { console.log('info json name property does not exist');process.exit() }
  if (!fs.existsSync(managedPath)) { console.log(`_managed dir does not exist`);process.exit() }
  
  const driveName = infoJson.name
  console.log(`parsing drive '${driveName}'`)
  
  if (!mediaObject.general.drive[driveName]) {
    
    const statfs = fs.statfsSync(defaultWorkingPath)
    
    mediaObject.general.drive[driveName] = {
      name: driveName, //'TGPro-1TB-000',
      date: new Date().toISOString(),
      type: 'media', // 'dump' is the other option not applicable here
      space: {
        size: 0, // failing to get actual size value
        used: 0,  // will probably have to just add everything with bytes on the disk but this might not work if something is outside of _managed(which it shouldnt)
        free: statfs.bsize*statfs.bfree, // from fsStats
        freeString: convertBytesToHumanReadable(statfs.bsize*statfs.bfree),
        files: 0,
        folders: 0,
      },
      topLevelFolders: [], // 'anime','manga'
    }
  }
  const data = await parseMediaData({driveName,managedPath})
  
  process.exit()
  
  
  
})()

async function parseMediaData(args) {
  const managedPath = args.managedPath
  const driveName = args.driveName
  const drive = mediaObject.general.drive[driveName]
  console.log(`parseMediaData: args`, args)
  
  const parentMediaPathNames = fs.readdirSync(managedPath)
  console.log('media folders', parentMediaPathNames)
  drive.topLevelFolders = parentMediaPathNames
  
  for (let i = 0; i < parentMediaPathNames.length; i++) {
    const parentMediaPathName = parentMediaPathNames[i]
    const parentMediaPath = path.join(managedPath, parentMediaPathName)
    console.log('parsing media folder', parentMediaPath)
    
    const parentMediaNames = fs.readdirSync(parentMediaPath)
    console.log('parent media name', parentMediaNames)
    
    for (let j = 0; j < parentMediaNames.length; j++) {
      const mediaName = parentMediaNames[j]
      let bytes = 0
      let files = 0
      let folders = 0
      console.log(`parsing '${mediaName}' for type '${parentMediaPathName}'`)
      const mediaPath = path.join(parentMediaPath, mediaName)
      console.log('mediaPath', mediaPath)
      
      const objects = fs.readdirSync(mediaPath, {recursive:true})
      for (let k = 0; k < objects.length; k++) {
        const objectName = objects[k]
        const objectPath = path.join(mediaPath, objectName)
        const stats = fs.statSync(objectPath)
        //console.log(`stats for '${objectPath}'`, stats)
        // first time im differenciating files/folders by this integer
        if (stats.mode === 33206) { // file
          files+=1
          bytes+=stats.size
        }
        if (stats.mode === 16822) { // folder
          folders+=1
        }
      }
      drive.space.files+=files
      drive.space.folders+=folders
      drive.space.used+=bytes
      
      console.log(`results for ${mediaPath}:\nfiles: ${drive.space.files}\nfolders: ${drive.space.folders}\nbytes: ${convertBytesToHumanReadable(drive.space.used)}`)
      process.exit()
    }
    process.exit()
  }
}

function convertBytesToHumanReadable(bytes) {
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
}