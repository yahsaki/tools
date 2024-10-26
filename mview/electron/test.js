const md = require('./lib/metadata')
const m3 = require('./m3')

;(async => {
  m3.init()
})()

function doStuff1() {

}

function doStuff0() {
  const res = md.scanMusicFolder()
  console.log(res)
  const playlist = md.generatePlaylist(res)
  console.log(playlist)
}
