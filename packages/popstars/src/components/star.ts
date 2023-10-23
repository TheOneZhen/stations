import { Graphics } from "pixi.js";

class Star {
  graphics: Graphics

  constructor (
    public x: number,
    public y: number,
    public size: number,
    public color: string,
    public selected: boolean = false
  ) {
    this.graphics = new Graphics()

    this.graphics.beginFill(0xFFFFFF, 1)
    this.graphics.drawRect(0, this.y, this.size, this.size)
    this.graphics.endFill()

    this.graphics.lineStyle(0)
    this.graphics.beginFill(this.color, 1)
    this.graphics.drawPolygon([])
    this.graphics.endFill()
  }
}