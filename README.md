# ThinkyAndTheChain

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.1.

# Introduction

Run `npm run start` and then navigate to `http://localhost:4200/` in your browser of choice.
- You can then choose word length
- Starting word
- Destination word
And finally 
- What type of search.

Then just click "Create Path"

## The main idea
- Check to see if a word exists which is 1 character off
- Collect all words that are one off the first.
- Prioritise words by score e.g. each correct letter
- If no clean winner, shuffle.
- In that order create the new word.
- Loop

## Personal Notes
Ideally I would sanitise the dictionary by ordering it by length, but I think in this scenario it would be potentially cheating.
The code is also currently massively underperformant and the UX is pants. But evening time is fleeting.
If you click the Create path button too quickly, the page ocassionally crashes

# To do
Having some trouble when the word ivy is reached.
As it's 1 word back is icy, ice, ire. So my chain to go back to a functioning work needs fixing
