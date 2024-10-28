const fs = require('node:fs')
const { createCanvas, loadImage } = require('canvas')
const d = {x:200,y:100}
const canvas = createCanvas(d.x, d.y)
const ctx = canvas.getContext('2d')

const settings = {
  fonts: ['Impact','Arial','Verdana','Tahoma','Georgia','Garamond','Courier New'],
  fontColors: ['green','brown','black','purple'],
  size: {min:30,max:20}, // max=50
  rotations: [-0.2,-0.1,0,0.1,0.2],
  opacities: [0.3,0.4,0.5,0.6,0.7,0.8,0.9,1],
}
const equation = generateEquation()

// Write "Awesome!"
//ctx.font = '30px Impact'
ctx.font = `${(settings.size.min-1) + Math.floor(Math.random() * settings.size.max)}px ${settings.fonts[Math.floor(Math.random() * settings.fonts.length)]}`

ctx.rotate(settings.rotations[Math.floor(Math.random() * settings.rotations.length)])
ctx.fillStyle = settings.fontColors[Math.floor(Math.random() * settings.fontColors.length)]
//ctx.fillRect(10, 10, 150, 100)
ctx.fillText(`${equation.n0}${equation.positive ? '+' : '-'}${equation.n1}`, 40, 50)

// Draw line under text
var text = ctx.measureText('Awesome!')
//ctx.strokeStyle = 'rgba(0,0,0,0.5)'
ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${settings.opacities[Math.floor(Math.random() * settings.opacities.length)]})`
ctx.beginPath()
ctx.lineTo(0, Math.floor(Math.random() * d.y))
ctx.lineTo(d.x, d.y)
ctx.stroke()

const buf = canvas.toBuffer('image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE })
fs.writeFileSync('file.png', buf)

function generateEquation() {
  const equation = {
    n0: null,
    n1: null,
    positive: null,
    answer: null,
  }
  let success = false // equation answer cant be negative
  let bool = !!Math.floor(Math.random() * 2)
  if (!bool) {
    // roll it again because positive preferred
    bool = !!Math.floor(Math.random() * 2)
  }
  const n0 = Math.floor(Math.random() * 50)
  const n1 = Math.floor(Math.random() * 50)
  equation.positive = bool
  if (equation.positive) {
    // addition
    equation.n0 = n0
    equation.n1 = n1
    equation.anwser = n0 + n1
  } else {
    // subtraction
    if (n0 - n1 >= 0) {
      equation.n0 = n0
      equation.n1 = n1
      equation.answer = n0 - n1
    } else {
      equation.n0 = n1
      equation.n1 = n0
      equation.answer = n1 - n0
    }
  }
  return equation
}