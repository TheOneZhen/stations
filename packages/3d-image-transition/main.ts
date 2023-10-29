import { WebGLRenderer, PerspectiveCamera, Scene } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class ImageTransition {

  config = {
    fov: 60,
    aspect: window.innerHeight / window.innerWidth,
    near: 10,
    far: 100000,
    createCameraControls: true
  }

  renderer = new WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio === 1 // 是否执行抗锯齿
  })

  scene = new Scene()

  camera: PerspectiveCamera
  controls: OrbitControls

  constructor (config: any) {
    Object.assign(this.config, config)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.camera = new PerspectiveCamera(
      this.config.fov,
      this.config.aspect,
      this.config.near,
      this.config.far
    )
    if (this.config.createCameraControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    }

    this.resize()
    this.tick()
    window.addEventListener('resize', this.resize, false)
  }

  resize () {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  render () {
    this.renderer.render(this.scene, this.camera)
  }

  update () {
    this.controls && this.controls.update()
  }

  tick () {
    this.update()
    this.render()
    requestAnimationFrame(this.tick)
  }
}