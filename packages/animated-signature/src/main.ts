import AnimatedSignature from './dist/AnimatedSignature'

const app = document.getElementById('app')
const canvas = document.createElement('canvas')
canvas.style.width
const animatedSignature = new AnimatedSignature(canvas, {
  duration: [1000, 1000],
  drawingMode: 'parallel',
  gap: 100
}, {})

function generateButton (text: string, cb: Function) {
  const button = document.createElement('button')
  button.className = 'demo-button'
  button.innerText = text
  button.onclick = (event) => {
    cb(event)
  }
}

