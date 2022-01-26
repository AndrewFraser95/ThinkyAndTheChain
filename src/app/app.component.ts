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
  dictionary: string[] = [];
  dictionaryAtLength: string[] = [];
  wordsWithCorrectCount: string[] = [];
  globalPathSteps: string[] = ['a', 'hop', 'a', 'skip', 'and', 'a', 'jump'];
  pathSteps: string[] = ['a', 'hop', 'a', 'skip', 'and', 'a', 'jump'];
  alphabet: string[] = createAlphabet();

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

  errorMessage: string = '';
  @Input() starterWord: string = 'N/A';
  @Input() destinationWord: string = 'N/A';
  @Input() wordLength = this.wordLengths[0].value;
  @Input() typeOfSearch = this.typesOfSearch[0].value;

  // On page load, initialise dictionary
  async ngOnInit() {
    this.dictionary = await getDictionary();
    this.getWordListForLength(this.wordLength);
  }

  async getWordListForLength(newCount: number) {
    const dictionaryForWordLength = await getDictionaryAtWordLength(
      this.dictionary,
      newCount
    );
    this.wordsWithCorrectCount = dictionaryForWordLength;
    this.dictionaryAtLength = dictionaryForWordLength;
  }

  onChangeSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    const reducedList = search(searchTerm, this.dictionaryAtLength);
    this.wordsWithCorrectCount = reducedList;
  }

  // Without undoing all the work and creating a tree of words
  // "Neural-netting" the solution by bruteforcing it, is the
  // sad outcome of the "Type" of search
  createPathBruteforce() {
    let lowestLength = 100;
    let bestChain: string[] = [];

    // typeOfSearch is a loop counter for how many to perform
    for (let index = 0; index < this.typeOfSearch; index++) {
      const path = this.createPathBetweenWords();
      console.log('pathy')
      console.log(path.length);
      console.log(lowestLength);
      if (lowestLength > 1 && path.length <= lowestLength) {
        console.log('innars');
        lowestLength = path.length;
        bestChain = path;
      }
    }
    console.log(bestChain);
    this.globalPathSteps = bestChain;
  }

  createPathBetweenWords(): string[] {
    var pathCompleted = false;
    const startWord = this.starterWord;
    const destinationWord = this.destinationWord;

    let exceptionOccured = false;
    let alreadyTraversed: string[] = [];
    let wordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    let anchorWordsWithScore: WordScore[] = [{ word: startWord, score: 0 }];
    this.pathSteps = [];
    this.pathSteps.push(startWord);

    if (startWord !== 'N/A' && destinationWord !== 'N/A') {
      do {
        let newWordsWithScore: WordScore[] = [];
        let anchorWordTopScore = -1;

        wordsWithScore.forEach((wordWithScore) => {
          newWordsWithScore = [];
          if (wordWithScore == undefined) {
            exceptionOccured = true;
          }
          const wordsOneOff = this.createAdjacentWordsList(wordWithScore.word);
          if (wordsOneOff.length == 0) {
            exceptionOccured = true;
          }

          newWordsWithScore = this.giveWordScoreAndSort(
            wordsOneOff,
            newWordsWithScore
          );

          newWordsWithScore =
            this.shuffleWordOrderIfNoClearWinner(newWordsWithScore);
          if (newWordsWithScore.length == 0) {
            exceptionOccured = true;
          }

          // It's roughly here I need to check the scores to see if progress has been made
          // If not, we need to go back a word to the next word, if available.
          if (
            newWordsWithScore.length <= 1 ||
            newWordsWithScore[0].score <= anchorWordTopScore
          ) {
            newWordsWithScore = anchorWordsWithScore;
            if (this.pathSteps.length > 1) {
              this.pathSteps.pop();
            } else {
              exceptionOccured = true;
            }
          }

          if (
            newWordsWithScore.length > 0 &&
            newWordsWithScore.some((x: WordScore) => x.word === destinationWord)
          ) {
            pathCompleted = true;
          }

          anchorWordsWithScore = newWordsWithScore;
          newWordsWithScore = newWordsWithScore.filter((x: WordScore) => {
            return alreadyTraversed.includes(x.word) == false;
          });

          newWordsWithScore = this.markWordsAlreadyTraversed(
             newWordsWithScore,
             anchorWordsWithScore,
             alreadyTraversed
           );
        });
        // if (wordsWithScore === [newWordsWithScore[0]]) exceptionOccured = true;
        wordsWithScore = [newWordsWithScore[0]];
        //hacky hack hack
        if (wordsWithScore[0].word === 'ivy') wordsWithScore = [{ word: 'ice', score: 0}] as WordScore[];
      } while (pathCompleted == false && exceptionOccured == false);
      if (this.pathSteps.length > 1) {
        this.pathSteps = this.optimiseList(this.pathSteps);
      }
    }
    console.log('outside of loop');
    console.log(this.pathSteps);
    if (exceptionOccured) {
      this.errorMessage = 'These two words do not link in this dictionary';
    }
    if (startWord == 'N/A') {
      this.errorMessage = 'Please choose a starter word';
    } else if (destinationWord == 'N/A') {
      this.errorMessage = 'Please choose a destination word';
    }
    return this.pathSteps;
  }

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

  markWordsAlreadyTraversed(
    newWordsWithScore: WordScore[],
    anchorWordsWithScore: WordScore[],
    alreadyTraversed: string[]
  ): WordScore[] {
    let highestValueWord = '';
    if (newWordsWithScore != undefined && newWordsWithScore.length > 0) {
      highestValueWord = newWordsWithScore[0].word;
    } else {
      newWordsWithScore = anchorWordsWithScore;
    }

    if (alreadyTraversed.includes(highestValueWord)) {
      highestValueWord = newWordsWithScore[1].word;
      // newWordsWithScore.length > 0
      //   ? (highestValueWord = newWordsWithScore[1].word)
      //   : (exceptionOccured = true);
    } else {
      if (highestValueWord.length > 0) {
        alreadyTraversed.push(highestValueWord);
        this.pathSteps.push(highestValueWord);
      }
    }
    return newWordsWithScore;
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
    console.log(finalList)
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
function createAlphabet(): string[] {
  const alpha = Array.from(Array(26)).map((e, i) => i + 65);
  return alpha.map((x) => String.fromCharCode(x).toLowerCase());
}

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

function replaceCharacter(inputString: string, index: number, replacement: string): string {
    return `${inputString.substring(0, index)}${replacement}${inputString.substring(index + replacement.length)}`
}
