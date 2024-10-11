const { spawn } = require('node:child_process')



;(async () => {
  await vp9_2()
})()

async function vp9_2() {
  const source = 'C:\\Users\\Administrator\\Videos\\Bertha1.avi'
  const target = 'C:\\Users\\Administrator\\Videos\\VP9_2.webm'
  await invoke('cmd.exe', ['/c', 'vp9.bat', source, target])
}
async function vp9_1() {
  const source = 'C:\\Users\\Administrator\\Videos\\afterburner\\ZenlessZoneZero_2024_10_07_17_47_36_278.mkv'
  const target = 'C:\\Users\\Administrator\\Videos\\test.webm'
  let args = ['-i',source,'-c:v','libvpx-vp9','-vf',`scale=${45*16}:${45*9}`,'-b:v','0','-deadline','best','-row-mt','1','-c:a','libopus','-pass','1','-an','-y','pass1.mkv']
  let code = await invoke('ffmpeg', args)
  console.log(code)
  args = ['-i',source,'-c:v','libvpx-vp9','-vf',`scale=${45*16}:${45*9}`,'-b:v','0','-deadline','best','-row-mt','1','-c:a','libopus','-pass','2','-c:a','copy','-y','pass2.mkv']
  console.log(args)
  code = await invoke('ffmpeg', args)
  console.log(code)
}
async function vp9_0() {
  /*
   ffmpeg -i input.file \
   -c:v libvpx-vp9 -b:v 0 -crf 30 -pass 1 -an \
   -deadline best -row-mt 1 \
   -f null /dev/null && \
   ffmpeg -i input.file \
   -c:v libvpx-vp9 -b:v 0 -crf 30 -pass 2 \
   -deadline best -row-mt 1 \
   -c:a libopus -b:a 96k -ac 2 \
   output.webm
  */
  const source = 'C:\\Users\\Administrator\\Videos\\afterburner\\ZenlessZoneZero_2024_10_05_22_15_48_826.mkv'
  const target = 'C:\\Users\\Administrator\\Videos\\test.webm'
  let args = ['-i',source,'-c:v','libvpx-vp9','-b:v','3.5M','-crf','30','-pass','1','-an']
  args = args.concat(['-deadline','best','-row-mt','1','-f','null','NUL'])

  console.log(args)
  let code = await invoke('ffmpeg', args)
  console.log(code)
  args = ['ffmpeg','-i',source,'-c:v','libvpx-vp9','-b:v','3.5M','-crf','30','-pass','2']
  args = args.concat(['-deadline','best','-row-mt','1','-c:a','libopus','-b:a','96k','-ac','2','output.webm'])
  console.log(args)
  code = await invoke('ffmpeg', args)
  console.log(code)
}
async function simpleTest() {
  const source = 'C:\\Users\\Administrator\\Videos\\afterburner\\ZenlessZoneZero_2024_10_05_22_15_48_826.mkv'
  const target = 'C:\\Users\\Administrator\\Videos\\test.mkv'
  const code = await invoke('ffmpeg', ['-i', source, '-y', target])
  console.log(code)
}
function invoke(cmd, args) {
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
