import PIXI from 'pixi.js'

export class App {
  
  graph: PIXI.Application<PIXI.ICanvas>

  constructor () {
    this.graph = new PIXI.Application({
      resizeTo: window
    })
  }

  init () {}

}

const app = new App()

window.app = app

app.init()