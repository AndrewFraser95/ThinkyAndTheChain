# ThinkyAndTheChain

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.1.

# Introduction

Run `npm run start` and then navigate to `http://localhost:4200/` in your browser of choice.
- You can then choose word length
- Starting word
- Destination word
And finally 
- What type of search (for longer words you will want a more indepth search).

Then just click "Find Word Chain"

## The main idea
- Trying to traverse the word list, giving scores to adjacent words, like a neural network would do, learning links, could be interesting.

### More indepth plan.
- Collect all words that are one character different from starting word.
- Prioritise words by score e.g. each correct letter
- If no clean winner, shuffle.
- For the highest priority word, add to "used" list
- Then discover it's adjacent words
- Loop until all linked words are "used" or until chain is complete.
- Simplify chain where possible

## Personal Notes
- Hindsight, means that a tree pruning algorithm would have been a lot better
- The code is also currently massively underperformant and the UX is pants.

# Bugs
- Still doesn't always find the best chain
- Sometimes randomly the short searches will find a better route than longer searches.
- If you click the "Find Word Chain" button too quickly, the page ocassionally crashes.
- Jump count often just says "( jumps)" which should be handled in html and hidden when empty