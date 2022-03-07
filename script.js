const WORD_LEN = 5
const FLIP_DURATION = 500
const JUMP_DURATION = 500

const dictionary = []
const grid = document.querySelector("[grid]")
const alertContainer = document.querySelector("[data-alert-container]")
const keyboard = document.querySelector("[data-keyboard]")
const fromDate = new Date(2022, 2, 5)
const msDiffNow = Date.now() - fromDate
const dayDiffNow = msDiffNow / 1000 / 60 / 60 / 24
let targetWord = ""

const importDictionary = (file) => {
  fetch(file)
  .then(r => r.text())
  .then(text => {
    text.split('\n').forEach( word => {
      dictionary.push(word)
    })
  })
  .then( () => setTargetWord())
}

const setTargetWord = () => {
  targetWord = dictionary[Math.floor(dayDiffNow)]
}

const startInteraction = () => {
  document.addEventListener("click", handleClick)
  document.addEventListener("keydown", handleKeyDown)
}

const stopInteraction = () => {
  document.removeEventListener("click", handleClick)
  document.removeEventListener("keydown", handleKeyDown)
}

const handleClick = e => {
  if (e.target.matches("[data-key]")) {
    switch (e.target.dataset.key) {
      case 'ENTER':
        submitGuess()
        return
      case 'DELETE':
        deleteLetter()
        return
      default:
        pressKey(e.target.dataset.key)
        return
    }
  }
}

const handleKeyDown = e => {
  switch (true) {
    case /Enter/.test(e.key):
      submitGuess()
      return
    case /Backspace/.test(e.key): 
    case /Delete/.test(e.key):
      deleteLetter()
      return
    case /^[a-z]$/.test(e.key):
      pressKey(e.key)
      return
    default:
      return
  }
}

const pressKey = key => {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LEN) return

  const nextTile = grid.querySelector(":not([data-letter])")
  nextTile.dataset.letter = key.toLowerCase()
  nextTile.textContent = key
  nextTile.dataset.state = "active"
}

const deleteLetter = () => {
  const activeTiles = getActiveTiles()
  const lastTile = activeTiles[activeTiles.length - 1]

  if (lastTile == null) return
  lastTile.textContent = ""
  delete lastTile.dataset.state
  delete lastTile.dataset.letter
}

const submitGuess = () => {
  const activeTiles = [...getActiveTiles()]
  if (activeTiles.length !== WORD_LEN) {
    showAlert("Necessitas mas letras!")
    shakeTiles(activeTiles)
    return
  }
  
  const guess = activeTiles.map(el => el.dataset.letter).join("")

  if (!dictionary.includes(guess)) {
    showAlert("No es una palabra")
    shakeTiles(activeTiles)
    return
  }

  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess))
  activeTiles.at(-1).addEventListener("transitionend", () => {
    if (checkWinLose(guess, activeTiles)) {
      stopInteraction()
      return
    }

    startInteraction()
  }, { once: true })
}

const flipTile = (tile, idx, arr, guess) => {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`)

  setTimeout(() => {
    tile.classList.add("flip")
  }, idx * FLIP_DURATION / 2 )

  tile.addEventListener("transitionend", () => {
    tile.classList.remove("flip")
    if (targetWord[idx] === letter) {
      tile.dataset.state = "correct"
      key.classList.add("correct")
    } else if (targetWord.includes(letter)) {
      tile.dataset.state = "near"
      key.classList.add("near")
    } else {
      tile.dataset.state = "incorrect"
      key.classList.add("incorrect")
    }
  })
}

const getActiveTiles = () => {
  return grid.querySelectorAll('[data-state="active"')
}

const showAlert = (msg, duration = 1000) => {
  const alert = document.createElement('div')
  alert.innerHTML = msg
  alert.classList.add("alert")
  alertContainer.prepend(alert)

  if (duration == null) return
  setTimeout(() => {
    alert.classList.add("hide")
    alert.addEventListener("transitionend", () => {
      alert.remove()
    })
  }, duration)
}

const shakeTiles = tiles => {
  tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, { once: true })
  })
}

const checkWinLose = (guess, tiles) => {
  if (guess === targetWord) {
    showAlert("¡Ganaste!", 3000)
    jumpTiles(tiles)
    return true
  }

  const remainingTiles = grid.querySelectorAll(":not([data-letter])")
  if (remainingTiles.length === 0 ) {
    showAlert(`${targetWord.toUpperCase()}<BR>Perdiste :(`, null)
    return true
  }

  return false
}

const jumpTiles = tiles => {
  tiles.forEach((tile, idx) => {
    setTimeout(() => {
      tile.classList.add("jump")
      tile.addEventListener("animationend", () => {
        tile.classList.remove("jump")
      }, { once: true })
    }, idx * JUMP_DURATION / 3)
  })
}

importDictionary('/palabras.txt')
startInteraction()