import targetWords from './json/targetWords.json' with { type: 'json' };

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const targetWord = targetWords[Math.floor(Math.random() * targetWords.length)].toLowerCase()

startInteraction()

function startInteraction() {
  document.addEventListener("click", handleMouseClick)
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key)
    return
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess()
    return
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey()
    return
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess()
    return
  }

  else if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey()
    return
  }

  else if (e.key === "Shift") {

  }

  else {
    pressKey(e.key.toLowerCase())
    return
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LENGTH) return
  const nextTile = guessGrid.querySelector(":not([data-letter])")
  nextTile.dataset.letter = key.toLowerCase()
  nextTile.textContent = key
  nextTile.dataset.state = "active"
}

function deleteKey() {
  const activeTiles = getActiveTiles()
  const lastTile = activeTiles[activeTiles.length - 1]
  if (lastTile == null) return
  lastTile.textContent = ""
  delete lastTile.dataset.state
  delete lastTile.dataset.letter
}

function submitGuess() {
	const activeTiles = [...getActiveTiles()]
	if (activeTiles.length !== WORD_LENGTH) {
		showAlert('Not enough letters')
		shakeTiles(activeTiles)
		return
	}

	const guess = activeTiles.reduce((word, tile) => {
		return word + tile.dataset.letter
	}, '')

	if (!targetWords.includes(guess)) {
		showAlert('Not in word list')
		shakeTiles(activeTiles)
		return
	}

	stopInteraction()

	// My algorithm for determining classname of the letter
	let matchingChars = ''
	const classDictionary = { 1: '', 2: '', 3: '', 4: '', 5: '' }

	for (let i = 0; i < targetWord.length; i++) {
		const letter = guess[i]

		console.log(matchingChars)

		const rgx = new RegExp(`${letter}`, 'g')
		// Need to know the total appearances of the letter in the word
		const totalAppearances = (targetWord.match(rgx) || []).length
		// Also need to know all prior appearances of the letter in the word,
		//  so we don't mistakenly tell the user that a duplicate letter exists
		const priorAppearances = (matchingChars.match(rgx) || []).length

		// Letter not in word
		if (!targetWord.includes(letter)) {
			classDictionary[i + 1] = 'wrong'
			continue
		}

		// The letter is correct
		if (targetWord[i] === guess[i]) {
			classDictionary[i + 1] = 'correct'

			matchingChars = matchingChars + letter
			continue
		}

		// The letter is included in the word somewhere...

		// Look ahead... If there is a correct appearance further in the word, we need to know
		let futureCorrectAppearances = 0
		for (let j = i; j < targetWord.length; j++) {
			if (targetWord[j] === guess[j] && targetWord[j] === letter)
				futureCorrectAppearances++
		}

		console.log(
			`There are already ${futureCorrectAppearances} correct ahead of [${i}]: "${letter}"`
		)
		console.log(
			`There are already ${priorAppearances} which come before [${i}]: "${letter}"`
		)

		console.log(futureCorrectAppearances, priorAppearances, totalAppearances)

		// If there are already too many future / prior / future+prior appearances,
		//  there can not be another instance of this letter, so we must continue
		if (futureCorrectAppearances >= totalAppearances) {
			classDictionary[i + 1] = 'wrong'
			continue
		}
		if (priorAppearances >= totalAppearances) {
			classDictionary[i + 1] = 'wrong'
			continue
		}
		if (priorAppearances + futureCorrectAppearances >= totalAppearances) {
			classDictionary[i + 1] = 'wrong'
			continue
		}

		classDictionary[i + 1] = 'wrong-location'

		matchingChars = matchingChars + letter
	}

	activeTiles.forEach((value, index, array) => {
		flipTile(value, index, array, guess, classDictionary[index + 1])
	})
}

function flipTile(tile, index, array, guess, className) {
	const letter = tile.dataset.letter
	const key = keyboard.querySelector(`[data-key="${letter}"i]`)
	setTimeout(() => {
		tile.classList.add('flip')
	}, (index * FLIP_ANIMATION_DURATION) / 2)

	tile.addEventListener(
		'transitionend',
		() => {
			tile.classList.remove('flip')

			tile.dataset.state = className
			key.classList.add(className)

			if (index === array.length - 1) {
				tile.addEventListener(
					'transitionend',
					() => {
						startInteraction()
						checkWinLose(guess, array)
					},
					{ once: true }
				)
			}
		},
		{ once: true }
	)
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]')
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div")
  alert.textContent = message
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

function shakeTiles(tiles) {
  tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake")
      },
      { once: true }
    )
  })
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    showAlert("You Win", 5000)
    danceTiles(tiles)
    stopInteraction()
    return
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
  if (remainingTiles.length === 0) {
    showAlert(targetWord.toUpperCase(), null)
    stopInteraction()
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}
