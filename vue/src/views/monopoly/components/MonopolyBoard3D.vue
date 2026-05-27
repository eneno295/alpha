<template>
  <div class="board-wrap">
    <div ref="containerRef" class="board-3d" />
    <div class="zoom-bar">
      <button type="button" class="zoom-btn" title="放大" @click="zoomIn">+</button>
      <button type="button" class="zoom-btn" title="缩小" @click="zoomOut">−</button>
      <button type="button" class="zoom-btn reset" title="重置视角" @click="resetView">◎</button>
    </div>
    <p class="zoom-tip">双指捏合缩放 · 单指拖动旋转 · 滚轮缩放</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CELL, CELL_LABELS, HALF, cellColor, getCellPosition } from '../boardLayout'
import { BOARD_SIZE } from '../type'
import type { MonopolyRoom } from '../type'

const props = defineProps<{
  room: MonopolyRoom | null
}>()

const containerRef = ref<HTMLDivElement | null>(null)

const TILE_H = 0.55
const BASE_H = 0.45
const PIECE_Y = BASE_H + TILE_H + 0.55

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let controls: OrbitControls | undefined
let animationId = 0
let pieceMeshes: THREE.Mesh[] = []
let lastMoveKey = ''

const DEFAULT_CAMERA = { x: 0, y: 28, z: 24 }
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

function disposeMaterial(mat: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(mat) ? mat : [mat]
  list.forEach((m) => m.dispose())
}

function disposeScene() {
  cancelAnimationFrame(animationId)
  controls?.dispose()
  controls = undefined

  pieceMeshes.forEach((m) => {
    scene?.remove(m)
    m.geometry.dispose()
    disposeMaterial(m.material)
  })
  pieceMeshes = []

  if (scene) {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        disposeMaterial(obj.material)
      }
      if (obj instanceof THREE.Sprite) {
        ;(obj.material as THREE.SpriteMaterial).map?.dispose()
        obj.material.dispose()
      }
    })
  }

  renderer?.dispose()
  if (containerRef.value?.firstChild) {
    containerRef.value.removeChild(containerRef.value.firstChild)
  }
  scene = undefined
  camera = undefined
  renderer = undefined
}

function isCorner(index: number) {
  return [0, 10, 20, 30].includes(index)
}

function addCornerLandmark(group: THREE.Group, x: number, z: number, index: number) {
  const colors = [0xfbbf24, 0x94a3b8, 0x34d399, 0xfb7185]
  const geo = new THREE.CylinderGeometry(0.55, 0.7, 1.4, 8)
  const mat = new THREE.MeshStandardMaterial({
    color: colors[Math.floor(index / 10)] ?? 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.25,
  })
  const pillar = new THREE.Mesh(geo, mat)
  pillar.position.set(x, BASE_H + TILE_H + 0.7, z)
  pillar.castShadow = true
  group.add(pillar)
}

function addPropertyBuildings(group: THREE.Group, x: number, z: number, index: number) {
  const count = 1 + (index % 3)
  for (let b = 0; b < count; b++) {
    const w = 0.32 + (index % 4) * 0.06
    const h = 0.35 + ((index + b) % 5) * 0.18
    const d = 0.28 + (b % 2) * 0.1
    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cellColor(index)).multiplyScalar(0.72),
      roughness: 0.5,
      metalness: 0.12,
    })
    const building = new THREE.Mesh(geo, mat)
    const ox = (b - 1) * 0.38
    const oz = ((index + b) % 2 === 0 ? 1 : -1) * 0.22
    building.position.set(x + ox, BASE_H + TILE_H + h / 2, z + oz)
    building.castShadow = true
    group.add(building)
  }
}

function buildBoard(boardScene: THREE.Scene) {
  const group = new THREE.Group()

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(HALF * 2 + 5, BASE_H, HALF * 2 + 5),
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85, metalness: 0.05 }),
  )
  platform.position.y = BASE_H / 2
  platform.receiveShadow = true
  group.add(platform)

  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(HALF * 2 + 4.2, 0.12, HALF * 2 + 4.2),
    new THREE.MeshStandardMaterial({ color: 0x422006, roughness: 0.7 }),
  )
  rim.position.y = BASE_H + 0.06
  group.add(rim)

  const innerPark = new THREE.Mesh(
    new THREE.BoxGeometry(CELL * 5.2, 0.15, CELL * 5.2),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }),
  )
  innerPark.position.y = BASE_H + 0.12
  group.add(innerPark)

  for (let i = 0; i < BOARD_SIZE; i++) {
    const { x, z } = getCellPosition(i)
    const color = cellColor(i)

    const tileGeo = new THREE.BoxGeometry(CELL * 0.9, TILE_H, CELL * 0.9)
    const tileMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.08,
    })
    const tile = new THREE.Mesh(tileGeo, tileMat)
    tile.position.set(x, BASE_H + TILE_H / 2, z)
    tile.castShadow = true
    tile.receiveShadow = true
    group.add(tile)

    const topGeo = new THREE.BoxGeometry(CELL * 0.82, 0.08, CELL * 0.82)
    const topMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(1.12),
      roughness: 0.4,
      metalness: 0.05,
    })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.set(x, BASE_H + TILE_H + 0.04, z)
    group.add(top)

    if (isCorner(i)) addCornerLandmark(group, x, z, i)
    else addPropertyBuildings(group, x, z, i)

    const label = makeLabel(CELL_LABELS[i] ?? String(i))
    label.position.set(x, BASE_H + TILE_H + 1.15, z)
    group.add(label)
  }

  boardScene.add(group)
}

function makeLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(15,23,42,0.75)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 26px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.6, 0.65, 1)
  return sprite
}

function piecePosition(index: number, stack = 0): THREE.Vector3 {
  const { x, z } = getCellPosition(index)
  return new THREE.Vector3(x + stack * 0.32, PIECE_Y, z + stack * 0.22)
}

function syncPieces(room: MonopolyRoom) {
  const boardScene = scene
  if (!boardScene) return
  room.players.forEach((player, slot) => {
    if (!player) return
    let mesh = pieceMeshes[slot]
    if (!mesh) {
      const geo = new THREE.CapsuleGeometry(0.38, 0.55, 8, 16)
      const mat = new THREE.MeshStandardMaterial({
        color: player.color,
        roughness: 0.35,
        metalness: 0.35,
        emissive: new THREE.Color(player.color).multiplyScalar(0.15),
      })
      mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      pieceMeshes[slot] = mesh
      boardScene.add(mesh)
    }
    ;(mesh.material as THREE.MeshStandardMaterial).color.set(player.color)
    mesh.position.copy(piecePosition(player.position, slot))
  })
}

async function animateMove(slot: number, from: number, steps: number, mesh: THREE.Mesh) {
  for (let s = 1; s <= steps; s++) {
    const cell = (from + s) % BOARD_SIZE
    const target = piecePosition(cell, slot)
    const start = mesh.position.clone()
    const duration = 320
    const t0 = performance.now()
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration)
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        mesh.position.lerpVectors(start, target, ease)
        mesh.position.y = PIECE_Y + Math.sin(Math.PI * ease) * 1.1
        if (t < 1) requestAnimationFrame(tick)
        else {
          mesh.position.copy(target)
          resolve()
        }
      }
      requestAnimationFrame(tick)
    })
  }
}

async function playLastMove(room: MonopolyRoom) {
  const move = room.lastMove
  if (!move) return
  const key = `${move.at}-${move.clientId}-${move.steps}`
  if (key === lastMoveKey) return
  lastMoveKey = key

  const slot = room.players.findIndex((p) => p?.clientId === move.clientId)
  if (slot < 0) return
  const mesh = pieceMeshes[slot]
  if (!mesh) return

  mesh.position.copy(piecePosition(move.from, slot))
  await animateMove(slot, move.from, move.steps, mesh)
}

function initControls(cam: THREE.PerspectiveCamera, dom: HTMLElement) {
  const c = new OrbitControls(cam, dom)
  c.enableDamping = true
  c.dampingFactor = 0.08
  c.enablePan = true
  c.panSpeed = 0.6
  c.rotateSpeed = 0.65
  c.zoomSpeed = 1.1
  c.minDistance = 10
  c.maxDistance = 58
  c.maxPolarAngle = Math.PI / 2.05
  c.minPolarAngle = 0.25
  c.target.copy(DEFAULT_TARGET)
  return c
}

function initThree() {
  const el = containerRef.value
  if (!el) return

  const w = el.clientWidth
  const h = el.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x070d18)
  scene.fog = new THREE.Fog(0x070d18, 35, 90)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
  camera.position.set(DEFAULT_CAMERA.x, DEFAULT_CAMERA.y, DEFAULT_CAMERA.z)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  controls = initControls(camera, renderer.domElement)

  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x3d2b1f, 0.55))
  const sun = new THREE.DirectionalLight(0xfff0d4, 1.15)
  sun.position.set(14, 28, 12)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 2
  sun.shadow.camera.far = 80
  sun.shadow.camera.left = -22
  sun.shadow.camera.right = 22
  sun.shadow.camera.top = 22
  sun.shadow.camera.bottom = -22
  scene.add(sun)

  const fill = new THREE.DirectionalLight(0x6ea8ff, 0.35)
  fill.position.set(-10, 12, -8)
  scene.add(fill)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 1 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.05
  ground.receiveShadow = true
  scene.add(ground)

  buildBoard(scene)

  const activeScene = scene
  const activeCamera = camera
  const activeRenderer = renderer
  const activeControls = controls

  const loop = () => {
    animationId = requestAnimationFrame(loop)
    activeControls.update()
    activeRenderer.render(activeScene, activeCamera)
  }
  loop()
}

function onResize() {
  const el = containerRef.value
  if (!el || !renderer || !camera) return
  const w = el.clientWidth
  const h = el.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function zoomBy(factor: number) {
  if (!camera || !controls) return
  const offset = camera.position.clone().sub(controls.target)
  const len = offset.length() * factor
  const clamped = THREE.MathUtils.clamp(len, controls.minDistance, controls.maxDistance)
  offset.setLength(clamped)
  camera.position.copy(controls.target).add(offset)
  controls.update()
}

function zoomIn() {
  zoomBy(0.82)
}

function zoomOut() {
  zoomBy(1.22)
}

function resetView() {
  if (!camera || !controls) return
  camera.position.set(DEFAULT_CAMERA.x, DEFAULT_CAMERA.y, DEFAULT_CAMERA.z)
  controls.target.copy(DEFAULT_TARGET)
  controls.update()
}

watch(
  () => props.room,
  async (room) => {
    if (!room || !scene) return
    syncPieces(room)
    await playLastMove(room)
  },
  { deep: true },
)

onMounted(() => {
  initThree()
  window.addEventListener('resize', onResize)
  if (props.room) syncPieces(props.room)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  disposeScene()
})

defineExpose({ zoomIn, zoomOut, resetView })
</script>

<style scoped>
.board-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.board-3d {
  width: 100%;
  height: 100%;
  min-height: 280px;
  border-radius: 12px;
  overflow: hidden;
  touch-action: none;
}

.zoom-bar {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(6px);

  &.reset {
    font-size: 14px;
  }

  &:active {
    background: rgba(245, 158, 11, 0.35);
  }
}

.zoom-tip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.75);
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
</style>
