// ── Tab switching ──

const tabs = document.querySelectorAll('.tab')
const panels = document.querySelectorAll('.panel')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'))
    panels.forEach(p => p.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(tab.dataset.tab).classList.add('active')
  })
})

// ── Clock (Taiwan time) ──

const clockTimeEl = document.getElementById('clock-time')
const clockDateEl = document.getElementById('clock-date')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function updateClock() {
  const now = new Date()
  const opts = { timeZone: 'Asia/Taipei' }

  const h = now.toLocaleString('en-US', { ...opts, hour: '2-digit', hour12: false }).padStart(2, '0')
  const m = now.toLocaleString('en-US', { ...opts, minute: '2-digit' }).padStart(2, '0')
  const s = now.toLocaleString('en-US', { ...opts, second: '2-digit' }).padStart(2, '0')
  clockTimeEl.textContent = `${h}:${m}:${s}`

  const year = now.toLocaleString('en-US', { ...opts, year: 'numeric' })
  const month = now.toLocaleString('en-US', { ...opts, month: '2-digit' })
  const day = now.toLocaleString('en-US', { ...opts, day: '2-digit' })
  const weekday = WEEKDAYS[now.toLocaleString('en-US', { ...opts, weekday: 'short' }) === 'Sun' ? 0 :
    new Date(now.toLocaleString('en-US', { ...opts })).getDay()]

  const twDate = new Date(now.toLocaleString('en-US', { ...opts }))
  const wd = WEEKDAYS[twDate.getDay()]
  clockDateEl.textContent = `${year} 年 ${month} 月 ${day} 日 星期${wd}`
}

updateClock()
setInterval(updateClock, 1000)

// ── Stopwatch ──

const swTimeEl = document.getElementById('stopwatch-time')
const swStartBtn = document.getElementById('sw-start')
const swResetBtn = document.getElementById('sw-reset')
const swLapsEl = document.getElementById('sw-laps')

let swRunning = false
let swStartTime = 0
let swElapsed = 0
let swAnimFrame = null

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const millis = ms % 1000

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  const mmm = String(millis).padStart(3, '0')
  return `${hh}:${mm}:${ss}<span class="ms">.${mmm}</span>`
}

function updateStopwatch() {
  const now = performance.now()
  const total = swElapsed + (now - swStartTime)
  swTimeEl.innerHTML = formatStopwatch(Math.floor(total))
  swAnimFrame = requestAnimationFrame(updateStopwatch)
}

swStartBtn.addEventListener('click', () => {
  if (swRunning) {
    swRunning = false
    swElapsed += performance.now() - swStartTime
    cancelAnimationFrame(swAnimFrame)
    swStartBtn.textContent = '繼續'
    swStartBtn.classList.remove('running')
  } else {
    swRunning = true
    swStartTime = performance.now()
    swStartBtn.textContent = '暫停'
    swStartBtn.classList.add('running')
    swResetBtn.disabled = false
    updateStopwatch()
  }
})

swResetBtn.addEventListener('click', () => {
  swRunning = false
  swElapsed = 0
  cancelAnimationFrame(swAnimFrame)
  swTimeEl.innerHTML = formatStopwatch(0)
  swStartBtn.textContent = '開始'
  swStartBtn.classList.remove('running')
  swResetBtn.disabled = true
  swLapsEl.innerHTML = ''
})

// ── Pomodoro ──

const pomoTimeEl = document.getElementById('pomo-time')
const pomoStatusEl = document.getElementById('pomo-status')
const pomoProgressBar = document.getElementById('pomo-progress-bar')
const pomoStartBtn = document.getElementById('pomo-start')
const pomoResetBtn = document.getElementById('pomo-reset')
const pomoWorkInput = document.getElementById('pomo-work')
const pomoBreakInput = document.getElementById('pomo-break')
const pomoCompletedEl = document.getElementById('pomo-completed')

let pomoRunning = false
let pomoInterval = null
let pomoRemaining = 0
let pomoTotal = 0
let pomoIsBreak = false
let pomoCompleted = 0

// Load saved settings
const savedWork = localStorage.getItem('pomo-work')
const savedBreak = localStorage.getItem('pomo-break')
const savedCompleted = localStorage.getItem('pomo-completed')
if (savedWork) pomoWorkInput.value = savedWork
if (savedBreak) pomoBreakInput.value = savedBreak
if (savedCompleted) {
  pomoCompleted = parseInt(savedCompleted, 10)
  pomoCompletedEl.textContent = pomoCompleted
}

function getWorkSeconds() {
  return Math.max(1, parseInt(pomoWorkInput.value, 10) || 25) * 60
}

function getBreakSeconds() {
  return Math.max(1, parseInt(pomoBreakInput.value, 10) || 5) * 60
}

function formatPomo(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function updatePomoDisplay() {
  pomoTimeEl.textContent = formatPomo(pomoRemaining)
  const progress = pomoTotal > 0 ? ((pomoTotal - pomoRemaining) / pomoTotal) * 100 : 0
  pomoProgressBar.style.width = `${progress}%`
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) {
    // Audio not supported, skip silently
  }
}

function pomoTick() {
  pomoRemaining--
  updatePomoDisplay()

  if (pomoRemaining <= 0) {
    playBeep()

    if (pomoIsBreak) {
      // Break done, start new work session
      pomoIsBreak = false
      pomoTotal = getWorkSeconds()
      pomoRemaining = pomoTotal
      pomoStatusEl.textContent = '工作'
      pomoStatusEl.classList.remove('break')
      pomoProgressBar.classList.remove('break')
    } else {
      // Work done, start break
      pomoCompleted++
      pomoCompletedEl.textContent = pomoCompleted
      localStorage.setItem('pomo-completed', pomoCompleted)

      pomoIsBreak = true
      pomoTotal = getBreakSeconds()
      pomoRemaining = pomoTotal
      pomoStatusEl.textContent = '休息'
      pomoStatusEl.classList.add('break')
      pomoProgressBar.classList.add('break')
    }
    updatePomoDisplay()
  }
}

pomoRemaining = getWorkSeconds()
pomoTotal = pomoRemaining
updatePomoDisplay()

pomoStartBtn.addEventListener('click', () => {
  if (pomoRunning) {
    pomoRunning = false
    clearInterval(pomoInterval)
    pomoStartBtn.textContent = '繼續'
    pomoStartBtn.classList.remove('running')
  } else {
    if (pomoRemaining === 0) {
      pomoRemaining = getWorkSeconds()
      pomoTotal = pomoRemaining
    }
    pomoRunning = true
    pomoInterval = setInterval(pomoTick, 1000)
    pomoStartBtn.textContent = '暫停'
    pomoStartBtn.classList.add('running')
    pomoResetBtn.disabled = false
    // Save settings
    localStorage.setItem('pomo-work', pomoWorkInput.value)
    localStorage.setItem('pomo-break', pomoBreakInput.value)
  }
})

pomoResetBtn.addEventListener('click', () => {
  pomoRunning = false
  pomoIsBreak = false
  clearInterval(pomoInterval)
  pomoRemaining = getWorkSeconds()
  pomoTotal = pomoRemaining
  pomoStatusEl.textContent = '工作'
  pomoStatusEl.classList.remove('break')
  pomoProgressBar.classList.remove('break')
  updatePomoDisplay()
  pomoStartBtn.textContent = '開始'
  pomoStartBtn.classList.remove('running')
  pomoResetBtn.disabled = true
})

// Disable settings inputs while running
pomoWorkInput.addEventListener('change', () => {
  if (!pomoRunning && !pomoIsBreak) {
    pomoRemaining = getWorkSeconds()
    pomoTotal = pomoRemaining
    updatePomoDisplay()
    localStorage.setItem('pomo-work', pomoWorkInput.value)
  }
})

pomoBreakInput.addEventListener('change', () => {
  localStorage.setItem('pomo-break', pomoBreakInput.value)
})
