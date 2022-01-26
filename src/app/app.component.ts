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
  characterCounts: UserInput[] = [
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
    { value: 1, viewValue: 'Low accuracy' },
    { value: 8, viewValue: 'Medium accuracy' },
    { value: 15, viewValue: 'High accuracy' },
    { value: 30, viewValue: 'Shortest chain' },
  ];

  @Input() starterWord: string = 'N/A';
  @Input() destinationWord: string = 'N/A';
  @Input() characterCount = this.characterCounts[0].value;
  @Input() typeOfSearch = this.typesOfSearch[0].value;

  dictionary: string[] = [];
  dictionaryAtLength: string[] = [];
  wordsWithCorrectCount: string[] = [];
  globalPathSteps: string[] = ['a', 'hop', 'a', 'skip', 'and', 'a', 'jump'];
  pathSteps: string[] = ['a', 'hop', 'a', 'skip', 'and', 'a', 'jump'];
  alreadyTraversed: string[] = [];
  alphabet: string[] = createAlphabet();
  errorMessage: string = '';
  computeTime: string = '0ms';
  currentLowestJumpCount: string = '0';

  /* On page load, initialise dictionary and fetch word list */
  async ngOnInit() {
    this.dictionary = await getDictionary();
    this.getWordListForLength(this.characterCount);
  }

  /* Based on type, get best word chain */
  findWordChain() {
    this.currentLowestJumpCount = '';
    let lowestLength = 100;
    let bestChain: string[] = [];

    var startTime = performance.now();
    this.computeTime = 'TBC';
    this.errorMessage = '';

    // typeOfSearch is a loop counter for how many to perform
    for (let index = 0; index < this.typeOfSearch; index++) {
      const path = this.createPathBetweenWords();
      if (path.length > 1 && path.length <= lowestLength) {
        lowestLength = path.length;
        bestChain = path;
        this.currentLowestJumpCount = (lowestLength - 1).toString();
      }
    }

    var endTime = performance.now();
    this.computeTime = `${endTime - startTime} ms`;
    this.globalPathSteps = bestChain;

    if (this.globalPathSteps.length == 0) {
      this.errorMessage = 'Could not find a traversal';
    }
  }

  /* Main: Traverse word tree, via scores and randomness, and return chain if available */
  createPathBetweenWords(): string[] {
    var pathCompleted = false;
    const startWord = this.starterWord;
    const destinationWord = this.destinationWord;

    let exceptionOccured = false;
    let wordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    let previousWithScore: WordScore[] = [{ word: destinationWord, score: 0 }];
    let starterWordScore: WordScore[] = [{ word: startWord, score: 0 }];
    let loopCounter = 0;
    let roadBlock = '';

    let anchorWordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    this.pathSteps = [];
    this.pathSteps.push(startWord);

    if (startWord !== 'N/A' && destinationWord !== 'N/A') {
      this.alreadyTraversed = [];

      // Fail fast if destination has no chain
      if (this.createAdjacentWordsList(destinationWord).length == 0)
        exceptionOccured = true;

      do {
        loopCounter++;

        let wordWithScore = wordsWithScore[0];
        if (wordWithScore == undefined) {
          exceptionOccured = true;
        }
        if (
          wordsWithScore.length == 1 &&
          wordWithScore.word == previousWithScore[0].word
        ) {
          if (roadBlock != wordWithScore.word) {
            roadBlock = wordWithScore.word;
          }
          wordsWithScore = starterWordScore;
          this.alreadyTraversed = [];
        } else {
          previousWithScore = wordsWithScore;
        }
        let newWordsWithScore: WordScore[] = [];
        let anchorWordTopScore = -1;
        let wordsOneOff = this.createAdjacentWordsList(wordWithScore.word);
        if (wordsOneOff.length == 0) {
          newWordsWithScore = starterWordScore;
        }

        // Prune adjacent list of words already traversed
        wordsOneOff = wordsOneOff.filter((x) => {
          return !this.alreadyTraversed.includes(x.word);
        });

        // Give value and sort remaining words
        newWordsWithScore = this.giveWordScoreAndSort(
          wordsOneOff,
          newWordsWithScore
        );

        newWordsWithScore =
          this.shuffleWordOrderIfNoClearWinner(newWordsWithScore);

        if (
          newWordsWithScore.length <= 1 ||
          newWordsWithScore[0].score <= anchorWordTopScore
        ) {
          newWordsWithScore = anchorWordsWithScore;
          if (this.pathSteps.length > 1) {
            this.pathSteps.pop();
          }
        }

        if (
          newWordsWithScore.length > 0 &&
          newWordsWithScore.some((x: WordScore) => x.word === destinationWord)
        ) {
          pathCompleted = true;
        }

        // Set anchor word to return to
        anchorWordsWithScore = newWordsWithScore;

        newWordsWithScore = newWordsWithScore.filter((x: WordScore) => {
          return this.alreadyTraversed.includes(x.word) == false;
        });

        wordsWithScore = this.markWordsAlreadyTraversed(
          newWordsWithScore,
          anchorWordsWithScore
        );
      } while (
        pathCompleted == false &&
        exceptionOccured == false &&
        loopCounter < 500
      );
      if (this.pathSteps.length > 1) {
        this.pathSteps = this.optimiseList(this.pathSteps);
      }
    }

    if (exceptionOccured) {
      this.errorMessage = 'These two words do not link in this dictionary';
    }
    if (startWord == 'N/A') {
      this.errorMessage = 'Please choose a starter word';
    } else if (destinationWord == 'N/A') {
      this.errorMessage = 'Please choose a destination word';
    }

    // Check the path has been completed
    if (
      this.pathSteps.includes(startWord) &&
      this.pathSteps.includes(destinationWord)
    ) {
      return this.pathSteps;
    }
    return [];
  }

  /* Return dictionary for word length */
  async getWordListForLength(characterCount: number) {
    const dictionaryForWordLength = await getDictionaryAtWordLength(
      this.dictionary,
      characterCount
    );
    this.wordsWithCorrectCount = dictionaryForWordLength;
    this.dictionaryAtLength = dictionaryForWordLength;
  }

  /* Return filtered list after user search */
  onChangeSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    const reducedList = search(searchTerm, this.dictionaryAtLength);
    this.wordsWithCorrectCount = reducedList;
  }

  /* Sort adjacent words by their scores */
  giveWordScoreAndSort(
    wordsOneOff: WordScore[],
    newWordsWithScore: WordScore[]
  ): WordScore[] {
    wordsOneOff.forEach((x) =>
      newWordsWithScore.push(this.giveWordScore(x, this.destinationWord))
    );
    newWordsWithScore.sort((a, b) => {
      return b.score - a.score;
    });
    return newWordsWithScore;
  }

  /* Return rudimentary word score based on number of correct characters at correct indexes */
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

  /* Where no favourite adjacent word, shuffle words */
  shuffleWordOrderIfNoClearWinner(newWordsWithScore: WordScore[]): WordScore[] {
    if (newWordsWithScore.length > 0) {
      const tempFirstWordScore = newWordsWithScore[0].score;
      const areAllScoresTheSame = newWordsWithScore.every((word: WordScore) => {
        return word.score == tempFirstWordScore;
      });

      if (areAllScoresTheSame) {
        newWordsWithScore = shuffleArray(newWordsWithScore);
      }
    }
    return newWordsWithScore;
  }

  /* Update alreadyTraversed array with words that are about to be traversed */
  markWordsAlreadyTraversed(
    newWordsWithScore: WordScore[],
    anchorWordsWithScore: WordScore[]
  ): WordScore[] {
    let highestValueWord = '';
    if (newWordsWithScore != undefined && newWordsWithScore.length > 0) {
      highestValueWord = newWordsWithScore[0].word;
    } else {
      newWordsWithScore = anchorWordsWithScore;
    }

    if (this.alreadyTraversed.includes(highestValueWord)) {
      highestValueWord = newWordsWithScore[1].word;
    } else {
      if (highestValueWord.length > 0 && highestValueWord != this.starterWord) {
        this.alreadyTraversed.push(highestValueWord);
        this.pathSteps.push(highestValueWord);
      }
    }
    return [{ word: highestValueWord, score: 0 } as WordScore];
  }

  /* Return list of all words, except itself, that are 1 character away */
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

  /* Shorten the final chain if possible */
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

  /* Are these 2 strings, 1 chacter apart */
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

/* Helpers */

/* Create array with each letter of english alphabet */
function createAlphabet(): string[] {
  const alpha = Array.from(Array(26)).map((e, i) => i + 65);
  return alpha.map((x) => String.fromCharCode(x).toLowerCase());
}

/* Retrieve dictionary from file, split and sanitise */
async function getDictionary(): Promise<string[]> {
    var dictionary = fetch('/assets/dictionary.txt')
      .then(response => response.text())
      .then(data => { return data });
    const wordList = await dictionary;
  return wordList.split('\n').map(word => word.trim().replace("-", "")).filter(x => x !="");
}

/* Filter elements in dictionary by WordLength */
async function getDictionaryAtWordLength(dictionary: string[], wordLength: number): Promise<string[]> {
    return dictionary.filter((x: string) => x.length == wordLength)
}

/* Filter array by search term */
function search(searchTerm: string, dictionaryAtLength: string[]) {
  let filter = searchTerm.toLowerCase();
  const tempDictionary = dictionaryAtLength;
  return tempDictionary.filter((option) =>
    option.toLowerCase().startsWith(filter)
  );
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

/* Replace single character in string at index */
function replaceCharacter(inputString: string, index: number, replacement: string): string {
    return `${inputString.substring(0, index)}${replacement}${inputString.substring(index + replacement.length)}`
}
