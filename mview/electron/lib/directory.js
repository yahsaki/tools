const fs = require('node:fs')
const path = require('node:path')
const util = require('./util')
const isWin = process.platform === 'win32'

supportedAudioTypes = ['.ogg','.mp3']
supportedImageTypes = ['.jpg','.jpeg','.png']

const api = {
  scan: {
    bandcamp: (sourcePath) => {
      const data = [] // atm data = (record)labels
      const labelNames = fs.readdirSync(sourcePath)
      for (let i = 0; i < labelNames.length; i++) {
        const labelName = labelNames[i]
        const label = {
          title: labelName, // TODO: use something else other than the folder name due to char restrictions, fallback to folder name
          pathPart: labelName,
          banner: null,
          logo: null,
          releases: [],
        }
        const labelPath = path.join(sourcePath, labelName)
        const labelFolderStats = fs.statSync(labelPath)
        if (!labelFolderStats.isDirectory()) continue
        const releaseNames = fs.readdirSync(labelPath)
        //console.log(releaseNames)
        for (let j = 0; j < releaseNames.length; j++) {
          const releaseName = releaseNames[j]
          const robj = path.parse(releaseName)
          //console.log(robj)
          const release = {
            title: releaseName,
            pathPart: releaseName,
            cover: null,
            tracks: [],
          }

          if (robj.name.startsWith('banner') && supportedImageTypes.find(x => x === robj.ext.toLowerCase())) {
            label.banner = robj.base;continue
          }
          if (robj.name.startsWith('logo') && supportedImageTypes.find(x => x === robj.ext.toLowerCase())) {
            label.logo = robj.base;continue
          }

          const releasePath = path.join(labelPath, releaseName)
          const releaseFolderStats = fs.statSync(releasePath)
          if (!releaseFolderStats.isDirectory()) continue
          const trackNames = fs.readdirSync(releasePath)
          for (let k = 0; k < trackNames.length; k++) {
            const trackName = trackNames[k]
            const tobj = path.parse(trackName)
            const track = {
              title: '',
              pathPart: trackName,
            }
            if (tobj.name.startsWith('cover') && supportedImageTypes.find(x => x === tobj.ext.toLowerCase())) {
              release.cover = tobj.base;continue
            }

            if (supportedAudioTypes.find(x => x === tobj.ext.toLowerCase())) {
              track.title = tobj.name
              release.tracks.push(track)
            }
          }
          label.releases.push(release)
        }
        data.push(label)
      }
      return data
    },
  }
}


module.exports = api
