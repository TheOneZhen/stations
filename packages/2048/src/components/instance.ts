import { reactive } from "vue"

export class Instance {
  /** 棋盘尺寸 */
  size: number = 4
  /** 棋盘 */
  board = reactive(new Array(this.size).fill(undefined).map(row => new Array(this.size).fill(NaN)))
  /** 当前分数 */
  score: number = 0
  /** 游戏成功目标 */
  target: number = 2048

  constructor () {

  }

  generateRanNum () {
    const nums = new Array<number>(this.random(1, 2))
      .fill(NaN)
      .map(() => 2 << this.random(1, 4))
    while (nums.length !== 0) {
      let x = 0, y = 0, pos = this.random(0, this.board.length - 1)
      do {
        pos = (pos + 1) % this.board.length
        x = ~~(pos / this.size)
        y = pos % this.size
      } while (!Number.isNaN(this.board[x][y]))
      this.board[x][y] = nums.pop()
    }
  }

  moveLeft () {
    this.board.forEach(row => {
      let start = 0, end = 1
      while (end < row.length) {
        if (!Number.isNaN(row[start] + row[end])) {
          if (row[start] === row[end]) {
            row[start] *= 2
            row[end] = NaN
          }
          ++start
        } else if (Number.isNaN(row[start])) {
          row[start] = row[end]
          row[end] = NaN
        }
        ++end
      }
    })
  }

  moveRight () {
    this.board.forEach(row => {
      let start = row.length - 1, end = start - 1
      while (end >= 0) {
        if (!Number.isNaN(row[start] + row[end])) {
          if (row[start] === row[end]) {
            row[start] *= 2
            row[end] = NaN
          }
          --start
        } else if (Number.isNaN(row[start])) {
          row[start] = row[end]
          row[end] = NaN
        }
        --end
      }
    })
  }

  moveTop () {
    for (let row = 0; row < this.size; ++row) {
      
    }
  }

  moveBottom () {}

  random (start: number, end: number) {
    return start + Math.floor(Math.random() * (end - start + 1))
  }
}