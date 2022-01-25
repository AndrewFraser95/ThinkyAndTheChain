import { Component, Input } from '@angular/core';

interface UserInput {
  value: number;
  viewValue: string;
}

interface WordScore {
  word: string;
  score: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  @Input() starterWord: string = 'N/A';
  @Input() destinationWord: string = 'N/A';
  // @Input() typeOfSearch: number = 'N/A';

  startingCharacterCount = 3;
  dictionary: string[] = [];
  dictionaryAtLength: string[] = [];
  starterWords: string[] = [];
  destinationWords: string[] = [];
  pathSteps: string[] = ['a', 'hop', 'a', 'skip', 'and', 'a', 'jump'];
  alphabet: string[] = [];
  loopAllowance = 1000;

  title = 'thinkyAndTheChain';
  wordLengths: UserInput[] = [
    { value: 3, viewValue: 'Three' },
    { value: 4, viewValue: 'Four' },
    { value: 5, viewValue: 'Five' },
    { value: 6, viewValue: 'Six' },
    { value: 7, viewValue: 'Seven' },
    { value: 8, viewValue: 'Eight' },
    { value: 9, viewValue: 'Nine' },
    { value: 10, viewValue: 'Ten' },
    { value: 11, viewValue: 'Eleven' },
    { value: 12, viewValue: 'Twelve' },
    { value: 13, viewValue: 'Thirteen' },
  ];

  typesOfSearch: UserInput[] = [
    { value: 1, viewValue: 'Quick' },
    { value: 5, viewValue: 'Average' },
    { value: 25, viewValue: 'Slow' },
  ];

  @Input() wordLength = this.wordLengths[0].value;
  @Input() typeOfSearch = this.typesOfSearch[0].value;

  async ngOnInit() {
    this.dictionary = await getDictionary();
    this.getWordListForLength(3);
  }

  async getWordListForLength(newCount: number) {
    const dictionaryForWordLength = await getDictionaryAtWordLength(
      this.dictionary,
      newCount
    );
    this.starterWords = dictionaryForWordLength;
    this.destinationWords = dictionaryForWordLength;
    this.dictionaryAtLength = dictionaryForWordLength;
  }

  onStarterSearch(event: Event, isStarterWord: boolean) {
    const searchTerm = (event.target as HTMLInputElement).value;
    const reducedList = this.search(searchTerm);
    isStarterWord
      ? (this.starterWords = reducedList)
      : (this.destinationWords = reducedList);
  }

  search(searchTerm: string) {
    let filter = searchTerm.toLowerCase();
    const tempDictionary = this.dictionaryAtLength;
    return tempDictionary.filter((option) =>
      option.toLowerCase().startsWith(filter)
    );
  }

  createPathBruteforce() {
    let lowestLength = 100;
    let bestChain: string[] = [];
    for (let index = 0; index < this.typeOfSearch; index++) {
      const path = this.createPathBetweenWords();
      if (path.length < lowestLength) {
        lowestLength = path.length;
        bestChain = path;
      }
    }
    this.pathSteps = bestChain;
  }

  // Check to see if a word exists which is 1 character off
  // Collect all words that are one off the first.
  // Prioritise words by score e.g. each correct letter
  // If no clean winner, shuffle.
  // In that order create the new word.
  // Loop
  createPathBetweenWords(): string[] {
    var pathCompleted = false;
    const startWord = this.starterWord;
    const destinationWord = this.destinationWord;
    const alpha = Array.from(Array(26)).map((e, i) => i + 65);
    this.alphabet = alpha.map((x) => String.fromCharCode(x).toLowerCase());

    this.pathSteps = [];
    this.pathSteps.push(startWord);

    let exceptionOccured = false;
    let alreadyTraversed: string[] = [];
    let wordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    let anchorWordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    if (startWord !== 'N/A' && destinationWord !== 'N/A') {
      do {
        let newWordsWithScore: WordScore[] = [];
        let anchorWordTopScore = -1;

        wordsWithScore.forEach((wordWithScore) => {
          newWordsWithScore = [];
          if (wordWithScore != undefined) {
            const wordsOneOff = this.createAdjacentWordsList(wordWithScore.word);
            if (wordsOneOff == []) exceptionOccured = true;
            wordsOneOff.forEach((x) =>
              newWordsWithScore.push(this.giveWordScore(x, destinationWord))
            );
          } else {
            exceptionOccured = true;
          }

          newWordsWithScore.sort((a, b) => {
            return b.score - a.score;
          });

          if (newWordsWithScore.length > 0) {
            const tempFirstWordScore = newWordsWithScore[0].score;
            const areAllScoresTheSame = newWordsWithScore.every(
              (word: WordScore) => {
                return word.score == tempFirstWordScore;
              }
            );

            if (areAllScoresTheSame) {
              newWordsWithScore = shuffleArray(newWordsWithScore);
            }
          } else {
            exceptionOccured = true;
          }

          //It's roughly here I need to check the scores to see if progress has been made
          //If not, we need to go back a word to the next word, if available.
          if (
            newWordsWithScore.length <= 1 ||
            newWordsWithScore[0].score <= anchorWordTopScore
          ) {
            newWordsWithScore = anchorWordsWithScore;
            this.pathSteps.pop();
          }

          if (
            newWordsWithScore != [] &&
            newWordsWithScore.some((x: WordScore) => x.word === destinationWord)
          ) {
            pathCompleted = true;
          }

          anchorWordsWithScore = newWordsWithScore;
          newWordsWithScore = newWordsWithScore.filter((x: WordScore) => {
            return alreadyTraversed.includes(x.word) == false;
          });
          let highestValueWord = '';
          if (newWordsWithScore != undefined && newWordsWithScore.length > 0) {
            highestValueWord = newWordsWithScore[0].word;
          } else {
            newWordsWithScore = anchorWordsWithScore;
          }

          if (alreadyTraversed.includes(highestValueWord)) {
            // This exception occured may be too harsh
            newWordsWithScore.length > 0
              ? (highestValueWord = newWordsWithScore[1].word)
              : exceptionOccured = true;
          } else {
            if (highestValueWord.length > 0) {
              alreadyTraversed.push(highestValueWord);
            }
            if (highestValueWord.length > 0) {
              this.pathSteps.push(highestValueWord);
            }
          }
        });
        wordsWithScore = [newWordsWithScore[0]];

      } while (pathCompleted == false && exceptionOccured == false);
      this.pathSteps = this.optimiseList(this.pathSteps);
    }

    if (exceptionOccured) {
      this.pathSteps = ['These two words do not link in this dictionary'];
    }
    if (startWord == 'N/A') {
      this.pathSteps = ['Please choose a starter word'];
    } else if (destinationWord == 'N/A') {
      this.pathSteps = ['Please choose a destination word'];
    }
    return this.pathSteps;
  }

  giveWordScore(inputWordScore: WordScore, destinationWord: string): WordScore {
    var score = 0;
    const inputWord = inputWordScore.word;
    for (let i = 0; i < inputWord.length; i++) {
      if (inputWord.charAt(i) == destinationWord.charAt(i)) {
        score++;
      }
    }
    return { word: inputWord, score: score };
  }

  createAdjacentWordsList(inputWord: string): WordScore[] {
    let wordsOneCharacterOff: WordScore[] = [];
    this.alphabet.forEach((letter) => {
      for (let index = 0; index < inputWord.length; index++) {
        const newWord = replaceCharacter(inputWord, index, letter);
        // Don't add inputWord to avoid weird loops
        if (this.dictionary.includes(newWord) && newWord != inputWord) {
          wordsOneCharacterOff.push({ word: newWord, score: 0 });
        }
      }
    });
    return wordsOneCharacterOff;
  }

  optimiseList(finalList: string[]) {
    // If in the final list, any of the words are bridgeable, remove redundant words inbetween

    // Bridging will only work on lists more than 3 words longs
    if (finalList.length > 3) {
      for (let index = 0; index < finalList.length + 1; index++) {
        let longestJump = 0;
        for (
          let innerIndex = index + 2;
          innerIndex < finalList.length;
          innerIndex++
        ) {
          const wordInChainStep = finalList[innerIndex];
          if (this.isWordOneCharacterOff(finalList[index], wordInChainStep)) {
            const skippableJumps = innerIndex - index;
            if (skippableJumps > longestJump) {
              longestJump = skippableJumps;
            }
          }
        }
        // Spliced is 0 indexed, and don't want to remove final word, as jump still needs to be possible
        if (longestJump > 0) finalList.splice(index + 1, longestJump - 1);
      }
    }
    return finalList;
  }

  isWordOneCharacterOff(firstWord: string, secondWord: string): boolean {
    let score = 0;
    for (let i = 0; i < firstWord.length; i++) {
      if (firstWord.charAt(i) == secondWord.charAt(i)) {
        score++;
      }
    }
    return score >= firstWord.length - 1;
  }
}

// Helpers

async function getDictionary(): Promise<string[]> {
    var dictionary = fetch('/assets/dictionary.txt')
      .then(response => response.text())
      .then(data => { return data });
    const wordList = await dictionary;
  return wordList.split('\n').map(word => word.trim().replace("-", "")).filter(x => x !="");
}


async function getDictionaryAtWordLength(dictionary: string[], wordLength: number): Promise<string[]> {
    return dictionary.filter((x: string) => x.length == wordLength)
}

  /* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(wordScoreArray: WordScore[]): WordScore[] {
    if (wordScoreArray != undefined) {
      for (var i = wordScoreArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = wordScoreArray[i];
        wordScoreArray[i] = wordScoreArray[j];
        wordScoreArray[j] = temp;
      }
    }
     return wordScoreArray;
  }

function replaceCharacter(inputString: string, index: number, replacement: string): string {
    return `${inputString.substring(0, index)}${replacement}${inputString.substring(index + replacement.length)}`
}
