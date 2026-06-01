export interface PlacementQuestion {
  id: number;
  code: string | null;
  question: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 1,
    code: "int x = 5;\nint* p = &x;\n*p = 10;",
    question: "After this code runs, what is the value of x?",
    options: ["5", "10", "Address of x", "Undefined"],
    correctIndex: 1,
  },
  {
    id: 2,
    code: null,
    question: "What is the key difference between int& r = x; and int* p = &x;?",
    options: [
      "References cannot be null and cannot be reseated after initialization",
      "References use more memory than pointers",
      "Pointers are faster than references",
      "There is no practical difference",
    ],
    correctIndex: 0,
  },
  {
    id: 3,
    code: null,
    question: "When does a stack-allocated object's destructor run?",
    options: [
      "When you call delete on it",
      "When the program exits",
      "When it goes out of scope",
      "When the garbage collector runs",
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    code: null,
    question: "Which STL container gives O(1) average lookup by key?",
    options: ["std::map", "std::vector", "std::unordered_map", "std::list"],
    correctIndex: 2,
  },
  {
    id: 5,
    code: null,
    question: "What does template<typename T> let you write?",
    options: [
      "Code that works with multiple types without rewriting for each one",
      "Code that runs faster by avoiding virtual dispatch",
      "Code that can only be used with primitive types",
      "Code that compiles at runtime instead of compile time",
    ],
    correctIndex: 0,
  },
];

export function scoreAnswers(answers: number[]): number {
  let score = 0;
  for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
    if (answers[i] === PLACEMENT_QUESTIONS[i]!.correctIndex) {
      score++;
    }
  }
  return score;
}
