# you know ball

A quote game. You see the first half of a quote, you type the second half, and if you nail it you get told you know ball.

Quotes load live from the [dummyjson quotes API](https://dummyjson.com/quotes). No keys, no login, no build step: one HTML file, one CSS file, one JS file.

## Run it

Open `index.html`, or serve the folder with any static server. It needs network access to fetch quotes on first load; the pool is cached in localStorage for a week after that.

## Scoring

Your guess is normalized (case, punctuation, and filler words like "the" and "and" are ignored) and must match the rest of the quote, or land within a tight edit distance of it. A miss keeps the round open. Giving up resets your streak.

## License

AGPL-3.0. See [LICENSE](LICENSE).
