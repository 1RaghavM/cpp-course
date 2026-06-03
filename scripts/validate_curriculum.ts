/**
 * validate_curriculum.ts — Validate curriculum integrity for cpproad.
 *
 * Checks lesson ordering against C++ concept prerequisites,
 * scans generated content for forward references and factual concerns,
 * and reports coverage gaps.
 *
 * Usage:
 *   npx tsx scripts/validate_curriculum.ts --structure-only   # offline, no DB
 *   npx tsx scripts/validate_curriculum.ts --full              # also scans DB content
 *
 * Requires env vars for --full mode:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedLesson {
  number: string;
  learncpp_title: string;
  learncpp_url: string;
  chapter_sort_order: number;
  global_sort_order: number;
}

interface SeedChapter {
  number: string;
  learncpp_title: string;
  sort_order: number;
  lessons: SeedLesson[];
}

interface SeedData {
  chapters: SeedChapter[];
}

interface FlatLesson {
  number: string;
  title: string;
  chapterNumber: string;
  chapterTitle: string;
  globalOrder: number;
}

interface ConceptDef {
  /** Human-readable name for the concept */
  name: string;
  /** Concepts that must be introduced before this one */
  prerequisites: string[];
  /** Lesson number that first introduces this concept (matched by title keywords) */
  introducedBy: string | null;
  /** Keywords to detect this concept in lesson titles */
  titleKeywords: string[];
  /** Keywords to detect this concept in generated content (summaries/exercises) */
  contentKeywords: string[];
}

interface OrderingIssue {
  concept: string;
  conceptName: string;
  introducedInLesson: string;
  introducedInTitle: string;
  introducedAtOrder: number;
  prerequisiteConcept: string;
  prerequisiteName: string;
  prerequisiteLesson: string;
  prerequisiteTitle: string;
  prerequisiteAtOrder: number;
  severity: "error" | "warning";
  message: string;
}

interface ForwardReference {
  lessonNumber: string;
  lessonTitle: string;
  lessonOrder: number;
  referencedConcept: string;
  conceptName: string;
  conceptIntroducedInLesson: string;
  conceptIntroducedAtOrder: number;
  foundIn: "summary" | "exercise";
  exerciseTitle?: string;
  severity: "error" | "warning";
  message: string;
}

interface FactualConcern {
  lessonNumber: string;
  lessonTitle: string;
  pattern: string;
  matchedText: string;
  concern: string;
  severity: "warning" | "info";
  foundIn: "summary" | "exercise";
  exerciseTitle?: string;
}

interface CoverageGap {
  concept: string;
  conceptName: string;
  expectedInChapters: string;
  severity: "warning" | "info";
  message: string;
}

interface ValidationReport {
  timestamp: string;
  mode: "structure-only" | "full";
  ordering_issues: OrderingIssue[];
  forward_references: ForwardReference[];
  factual_concerns: FactualConcern[];
  coverage_gaps: CoverageGap[];
  summary: {
    total_lessons: number;
    total_chapters: number;
    concepts_mapped: number;
    concepts_with_lessons: number;
    ordering_errors: number;
    ordering_warnings: number;
    forward_reference_errors: number;
    forward_reference_warnings: number;
    factual_concerns_count: number;
    coverage_gaps_count: number;
    health_score: number;
    health_label: string;
    lessons_with_summaries?: number;
    lessons_without_summaries?: number;
    exercises_scanned?: number;
  };
}

// ---------------------------------------------------------------------------
// C++ Concept Dependency Map (50+ concepts)
// ---------------------------------------------------------------------------

const CONCEPT_MAP: Record<string, ConceptDef> = {
  // ---- Foundational concepts (Chapters 0-1) ----
  program_structure: {
    name: "Program Structure",
    prerequisites: [],
    introducedBy: null,
    titleKeywords: ["structure of a program", "statements"],
    contentKeywords: ["main()", "int main", "return 0", "statement"],
  },
  comments: {
    name: "Comments",
    prerequisites: ["program_structure"],
    introducedBy: null,
    titleKeywords: ["comments"],
    contentKeywords: ["//", "/*", "comment", "single-line comment", "multi-line comment"],
  },
  variables: {
    name: "Variables",
    prerequisites: ["program_structure"],
    introducedBy: null,
    titleKeywords: ["objects and variables", "variable assignment", "initialization"],
    contentKeywords: [
      "variable",
      "declaration",
      "assignment",
      "initialization",
      "int ",
      "double ",
      "identifier",
    ],
  },
  iostream: {
    name: "iostream (cout/cin)",
    prerequisites: ["variables"],
    introducedBy: null,
    titleKeywords: ["iostream", "cout", "cin"],
    contentKeywords: ["std::cout", "std::cin", "std::endl", "iostream", "<<", ">>"],
  },
  undefined_behavior: {
    name: "Undefined Behavior",
    prerequisites: ["variables"],
    introducedBy: null,
    titleKeywords: ["uninitialized variables", "undefined behavior"],
    contentKeywords: ["undefined behavior", "uninitialized", "UB"],
  },
  literals_operators: {
    name: "Literals and Operators",
    prerequisites: ["variables"],
    introducedBy: null,
    titleKeywords: ["literals and operators"],
    contentKeywords: ["literal", "operator", "operand"],
  },
  expressions: {
    name: "Expressions",
    prerequisites: ["literals_operators"],
    introducedBy: null,
    titleKeywords: ["expressions"],
    contentKeywords: ["expression", "evaluate", "subexpression"],
  },

  // ---- Functions (Chapter 2) ----
  functions: {
    name: "Functions",
    prerequisites: ["program_structure", "variables"],
    introducedBy: null,
    titleKeywords: ["introduction to functions"],
    contentKeywords: ["function", "return value", "void", "parameter", "argument", "call"],
  },
  function_parameters: {
    name: "Function Parameters",
    prerequisites: ["functions"],
    introducedBy: null,
    titleKeywords: ["function parameters and arguments"],
    contentKeywords: ["parameter", "argument", "pass by value"],
  },
  local_scope: {
    name: "Local Scope",
    prerequisites: ["functions", "variables"],
    introducedBy: null,
    titleKeywords: ["local scope"],
    contentKeywords: ["local scope", "block scope", "lifetime", "scope"],
  },
  forward_declarations: {
    name: "Forward Declarations",
    prerequisites: ["functions"],
    introducedBy: null,
    titleKeywords: ["forward declarations"],
    contentKeywords: ["forward declaration", "prototype", "declaration vs definition"],
  },
  namespaces: {
    name: "Namespaces",
    prerequisites: ["functions"],
    introducedBy: null,
    titleKeywords: ["namespaces"],
    contentKeywords: ["namespace", "std::", "name collision", "scope resolution", "::"],
  },
  preprocessor: {
    name: "Preprocessor",
    prerequisites: ["functions"],
    introducedBy: null,
    titleKeywords: ["preprocessor"],
    contentKeywords: ["#include", "#define", "#ifdef", "#ifndef", "preprocessor", "macro"],
  },
  header_files: {
    name: "Header Files",
    prerequisites: ["preprocessor", "forward_declarations"],
    introducedBy: null,
    titleKeywords: ["header files", "header guards"],
    contentKeywords: ["header file", ".h", "#pragma once", "header guard", "#include"],
  },

  // ---- Data Types (Chapter 4) ----
  fundamental_types: {
    name: "Fundamental Data Types",
    prerequisites: ["variables"],
    introducedBy: null,
    titleKeywords: ["fundamental data types"],
    contentKeywords: [
      "int",
      "double",
      "float",
      "char",
      "bool",
      "void",
      "data type",
      "fundamental type",
    ],
  },
  integers: {
    name: "Integers (signed/unsigned)",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["signed integers", "unsigned integers"],
    contentKeywords: [
      "signed",
      "unsigned",
      "short",
      "long",
      "overflow",
      "integer",
      "int8_t",
      "int16_t",
      "int32_t",
      "int64_t",
    ],
  },
  sizeof_operator: {
    name: "sizeof Operator",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["sizeof operator"],
    contentKeywords: ["sizeof", "object size", "byte"],
  },
  floating_point: {
    name: "Floating Point Numbers",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["floating point numbers"],
    contentKeywords: [
      "float",
      "double",
      "long double",
      "floating point",
      "precision",
      "rounding error",
    ],
  },
  booleans: {
    name: "Boolean Values",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["boolean values"],
    contentKeywords: ["bool", "true", "false", "boolean"],
  },
  if_statements: {
    name: "If Statements (basic)",
    prerequisites: ["booleans"],
    introducedBy: null,
    titleKeywords: ["introduction to if statements"],
    contentKeywords: ["if", "else", "condition", "conditional"],
  },
  chars: {
    name: "Characters (char)",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["chars"],
    contentKeywords: ["char", "character", "ASCII", "'A'", "single quote"],
  },
  type_conversion_basic: {
    name: "Type Conversion (basic)",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["type conversion and static_cast"],
    contentKeywords: ["static_cast", "type conversion", "cast", "implicit conversion"],
  },

  // ---- Constants and Strings (Chapter 5) ----
  constants: {
    name: "Constants",
    prerequisites: ["variables", "fundamental_types"],
    introducedBy: null,
    titleKeywords: ["constant variables", "named constants"],
    contentKeywords: ["const", "constant", "constexpr"],
  },
  constexpr_variables: {
    name: "Constexpr Variables",
    prerequisites: ["constants"],
    introducedBy: null,
    titleKeywords: ["constexpr variables", "constant expressions"],
    contentKeywords: ["constexpr", "compile-time constant", "constant expression"],
  },
  strings: {
    name: "std::string",
    prerequisites: ["variables", "iostream"],
    introducedBy: null,
    titleKeywords: ["std::string"],
    contentKeywords: ["std::string", "string", "getline", "string literal"],
  },
  string_view: {
    name: "std::string_view",
    prerequisites: ["strings", "constants"],
    introducedBy: null,
    titleKeywords: ["std::string_view"],
    contentKeywords: ["std::string_view", "string_view"],
  },

  // ---- Operators (Chapter 6) ----
  arithmetic_operators: {
    name: "Arithmetic Operators",
    prerequisites: ["variables", "fundamental_types"],
    introducedBy: null,
    titleKeywords: ["arithmetic operators"],
    contentKeywords: ["+", "-", "*", "/", "modulus", "remainder", "arithmetic"],
  },
  operator_precedence: {
    name: "Operator Precedence",
    prerequisites: ["arithmetic_operators"],
    introducedBy: null,
    titleKeywords: ["operator precedence"],
    contentKeywords: ["precedence", "associativity", "order of evaluation"],
  },
  relational_operators: {
    name: "Relational Operators",
    prerequisites: ["arithmetic_operators", "booleans"],
    introducedBy: null,
    titleKeywords: ["relational operators"],
    contentKeywords: ["==", "!=", "<", ">", "<=", ">=", "relational", "comparison"],
  },
  logical_operators: {
    name: "Logical Operators",
    prerequisites: ["booleans", "relational_operators"],
    introducedBy: null,
    titleKeywords: ["logical operators"],
    contentKeywords: ["&&", "||", "!", "logical AND", "logical OR", "logical NOT"],
  },
  conditional_operator: {
    name: "Conditional Operator",
    prerequisites: ["booleans", "if_statements"],
    introducedBy: null,
    titleKeywords: ["conditional operator"],
    contentKeywords: ["?:", "ternary", "conditional operator"],
  },

  // ---- Bit Manipulation (Chapter O) ----
  bit_manipulation: {
    name: "Bit Manipulation",
    prerequisites: ["integers", "logical_operators"],
    introducedBy: null,
    titleKeywords: ["bit flags", "bit manipulation", "bitwise operators"],
    contentKeywords: ["bitwise", "bit flag", "bit mask", "std::bitset"],
  },

  // ---- Scope, Duration, Linkage (Chapter 7) ----
  compound_statements: {
    name: "Compound Statements (Blocks)",
    prerequisites: ["local_scope"],
    introducedBy: null,
    titleKeywords: ["compound statements", "blocks"],
    contentKeywords: ["block", "compound statement", "nested block", "curly brace"],
  },
  global_variables: {
    name: "Global Variables",
    prerequisites: ["local_scope"],
    introducedBy: null,
    titleKeywords: ["global variables"],
    contentKeywords: ["global variable", "global scope", "file scope", "static duration"],
  },
  variable_shadowing: {
    name: "Variable Shadowing",
    prerequisites: ["local_scope", "global_variables"],
    introducedBy: null,
    titleKeywords: ["variable shadowing", "name hiding"],
    contentKeywords: ["shadowing", "name hiding", "shadow"],
  },
  linkage: {
    name: "Linkage (internal/external)",
    prerequisites: ["global_variables", "namespaces"],
    introducedBy: null,
    titleKeywords: ["internal linkage", "external linkage"],
    contentKeywords: ["internal linkage", "external linkage", "extern", "linkage"],
  },
  inline_functions: {
    name: "Inline Functions/Variables",
    prerequisites: ["functions", "header_files"],
    introducedBy: null,
    titleKeywords: ["inline functions"],
    contentKeywords: ["inline", "inline function", "inline variable", "ODR"],
  },
  static_local: {
    name: "Static Local Variables",
    prerequisites: ["local_scope", "global_variables"],
    introducedBy: null,
    titleKeywords: ["static local variables"],
    contentKeywords: ["static local", "static duration", "static keyword"],
  },

  // ---- Control Flow (Chapter 8) ----
  switch_statement: {
    name: "Switch Statement",
    prerequisites: ["if_statements"],
    introducedBy: null,
    titleKeywords: ["switch statement"],
    contentKeywords: ["switch", "case", "break", "default", "fallthrough"],
  },
  loops: {
    name: "Loops (while/do-while/for)",
    prerequisites: ["if_statements", "relational_operators"],
    introducedBy: null,
    titleKeywords: ["loops", "while statements", "for statements"],
    contentKeywords: ["while", "do while", "for", "loop", "iteration", "break", "continue"],
  },
  random_numbers: {
    name: "Random Number Generation",
    prerequisites: ["loops", "functions"],
    introducedBy: null,
    titleKeywords: ["random number generation", "mersenne twister"],
    contentKeywords: ["random", "mt19937", "uniform_int_distribution", "seed", "PRNG"],
  },

  // ---- Error Handling (Chapter 9) ----
  error_handling_basic: {
    name: "Error Detection and Handling",
    prerequisites: ["functions", "if_statements"],
    introducedBy: null,
    titleKeywords: ["detecting and handling errors"],
    contentKeywords: ["error handling", "assert", "static_assert", "precondition", "invariant"],
  },
  assert: {
    name: "Assert and static_assert",
    prerequisites: ["error_handling_basic", "constexpr_variables"],
    introducedBy: null,
    titleKeywords: ["assert and static_assert"],
    contentKeywords: ["assert", "static_assert", "NDEBUG", "cassert"],
  },

  // ---- Type Conversion (Chapter 10) ----
  implicit_conversion: {
    name: "Implicit Type Conversion",
    prerequisites: ["type_conversion_basic", "fundamental_types"],
    introducedBy: null,
    titleKeywords: ["implicit type conversion"],
    contentKeywords: ["implicit conversion", "promotion", "narrowing", "widening"],
  },
  type_aliases: {
    name: "Type Aliases (typedef/using)",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["typedefs", "type aliases"],
    contentKeywords: ["typedef", "type alias"],
  },
  auto_keyword: {
    name: "Auto Type Deduction",
    prerequisites: ["type_aliases", "variables"],
    introducedBy: null,
    titleKeywords: ["auto keyword", "type deduction"],
    contentKeywords: ["auto", "type deduction", "decltype"],
  },

  // ---- Function Overloading & Templates (Chapter 11) ----
  function_overloading: {
    name: "Function Overloading",
    prerequisites: ["functions", "fundamental_types"],
    introducedBy: null,
    titleKeywords: ["function overloading"],
    contentKeywords: [
      "overload",
      "overloading",
      "overload resolution",
      "ambiguous",
      "function signature",
    ],
  },
  default_arguments: {
    name: "Default Arguments",
    prerequisites: ["functions"],
    introducedBy: null,
    titleKeywords: ["default arguments"],
    contentKeywords: ["default argument", "default parameter", "default value"],
  },
  function_templates: {
    name: "Function Templates",
    prerequisites: ["function_overloading", "auto_keyword"],
    introducedBy: null,
    titleKeywords: ["function templates"],
    contentKeywords: [
      "template",
      "template<",
      "typename",
      "function template",
      "template parameter",
      "instantiation",
    ],
  },
  non_type_template_params: {
    name: "Non-type Template Parameters",
    prerequisites: ["function_templates"],
    introducedBy: null,
    titleKeywords: ["non-type template parameters"],
    contentKeywords: ["non-type template parameter", "template<int", "template<auto"],
  },

  // ---- Constexpr Functions (Chapter F) ----
  constexpr_functions: {
    name: "Constexpr Functions",
    prerequisites: ["constexpr_variables", "functions"],
    introducedBy: null,
    titleKeywords: ["constexpr functions"],
    contentKeywords: ["constexpr function", "consteval", "constexpr", "compile-time evaluation"],
  },
  consteval: {
    name: "Consteval",
    prerequisites: ["constexpr_functions"],
    introducedBy: null,
    titleKeywords: ["consteval"],
    contentKeywords: ["consteval", "immediate function"],
  },

  // ---- References and Pointers (Chapter 12) ----
  lvalue_rvalue: {
    name: "Lvalues and Rvalues",
    prerequisites: ["variables", "expressions"],
    introducedBy: null,
    titleKeywords: ["lvalues and rvalues", "value categories"],
    contentKeywords: ["lvalue", "rvalue", "value category", "l-value", "r-value"],
  },
  references: {
    name: "Lvalue References",
    prerequisites: ["lvalue_rvalue", "variables"],
    introducedBy: null,
    titleKeywords: ["lvalue references"],
    contentKeywords: ["lvalue reference", "alias"],
  },
  const_references: {
    name: "Const References",
    prerequisites: ["references", "constants"],
    introducedBy: null,
    titleKeywords: ["lvalue references to const", "const lvalue reference"],
    contentKeywords: ["const reference", "const lvalue reference"],
  },
  pass_by_reference: {
    name: "Pass by Reference",
    prerequisites: ["references", "function_parameters"],
    introducedBy: null,
    titleKeywords: ["pass by lvalue reference", "pass by const lvalue reference"],
    contentKeywords: ["pass by reference", "reference parameter"],
  },
  pointers: {
    name: "Pointers",
    prerequisites: ["variables", "references"],
    introducedBy: null,
    titleKeywords: ["introduction to pointers"],
    contentKeywords: ["pointer", "dereference", "address-of", "nullptr"],
  },
  null_pointers: {
    name: "Null Pointers",
    prerequisites: ["pointers"],
    introducedBy: null,
    titleKeywords: ["null pointers"],
    contentKeywords: ["nullptr", "NULL", "null pointer"],
  },
  pointers_and_const: {
    name: "Pointers and Const",
    prerequisites: ["pointers", "constants"],
    introducedBy: null,
    titleKeywords: ["pointers and const"],
    contentKeywords: ["const int*", "int* const", "pointer to const", "const pointer"],
  },
  pass_by_address: {
    name: "Pass by Address",
    prerequisites: ["pointers", "function_parameters"],
    introducedBy: null,
    titleKeywords: ["pass by address"],
    contentKeywords: ["pass by address", "pointer parameter"],
  },
  return_by_reference: {
    name: "Return by Reference/Address",
    prerequisites: ["references", "pointers", "functions"],
    introducedBy: null,
    titleKeywords: ["return by reference", "return by address"],
    contentKeywords: ["return by reference", "return by address", "dangling reference"],
  },
  std_optional: {
    name: "std::optional",
    prerequisites: ["references", "function_templates"],
    introducedBy: null,
    titleKeywords: ["std::optional"],
    contentKeywords: ["std::optional", "optional", "has_value", "value_or"],
  },

  // ---- Enums and Structs (Chapter 13) ----
  enums: {
    name: "Enumerations",
    prerequisites: ["fundamental_types"],
    introducedBy: null,
    titleKeywords: ["unscoped enumerations", "scoped enumerations", "enum classes"],
    contentKeywords: ["enum", "enumerator", "enumeration", "enum class", "scoped enum"],
  },
  structs: {
    name: "Structs",
    prerequisites: ["variables", "fundamental_types"],
    introducedBy: null,
    titleKeywords: ["introduction to structs", "struct aggregate"],
    contentKeywords: ["struct", "member", "aggregate", "member selection", "dot operator"],
  },
  class_templates: {
    name: "Class Templates",
    prerequisites: ["structs", "function_templates"],
    introducedBy: null,
    titleKeywords: ["class templates"],
    contentKeywords: ["class template", "template class", "template struct", "CTAD"],
  },

  // ---- Classes (Chapters 14-15) ----
  classes: {
    name: "Classes",
    prerequisites: ["structs", "functions"],
    introducedBy: null,
    titleKeywords: ["introduction to classes"],
    contentKeywords: ["class", "member function", "method", "public", "private"],
  },
  member_functions: {
    name: "Member Functions",
    prerequisites: ["classes"],
    introducedBy: null,
    titleKeywords: ["member functions"],
    contentKeywords: ["member function", "method", "implicit object"],
  },
  access_specifiers: {
    name: "Access Specifiers",
    prerequisites: ["classes"],
    introducedBy: null,
    titleKeywords: ["public and private", "access specifiers"],
    contentKeywords: ["public", "private", "protected", "access specifier", "encapsulation"],
  },
  encapsulation: {
    name: "Encapsulation",
    prerequisites: ["access_specifiers"],
    introducedBy: null,
    titleKeywords: ["data hiding", "encapsulation"],
    contentKeywords: ["encapsulation", "data hiding", "information hiding", "getter", "setter"],
  },
  constructors: {
    name: "Constructors",
    prerequisites: ["classes", "member_functions"],
    introducedBy: null,
    titleKeywords: ["introduction to constructors"],
    contentKeywords: ["constructor", "default constructor", "member initializer list"],
  },
  copy_constructor: {
    name: "Copy Constructor",
    prerequisites: ["constructors"],
    introducedBy: null,
    titleKeywords: ["copy constructor"],
    contentKeywords: ["copy constructor", "copy", "copy elision"],
  },
  explicit_keyword: {
    name: "Explicit Keyword",
    prerequisites: ["constructors", "type_conversion_basic"],
    introducedBy: null,
    titleKeywords: ["explicit keyword", "converting constructors"],
    contentKeywords: ["explicit", "converting constructor", "implicit conversion"],
  },
  this_pointer: {
    name: "The this Pointer",
    prerequisites: ["classes", "pointers"],
    introducedBy: null,
    titleKeywords: ["hidden this pointer"],
    contentKeywords: ["this pointer", "method chaining"],
  },
  destructors: {
    name: "Destructors",
    prerequisites: ["constructors"],
    introducedBy: null,
    titleKeywords: ["introduction to destructors", "destructors"],
    contentKeywords: ["destructor", "cleanup", "RAII"],
  },
  static_members: {
    name: "Static Members",
    prerequisites: ["classes", "member_functions"],
    introducedBy: null,
    titleKeywords: ["static member"],
    contentKeywords: ["static member", "static variable", "static function", "class-level"],
  },
  friend_functions: {
    name: "Friend Functions/Classes",
    prerequisites: ["classes", "access_specifiers"],
    introducedBy: null,
    titleKeywords: ["friend"],
    contentKeywords: ["friend function", "friend class"],
  },

  // ---- std::vector (Chapter 16) ----
  std_vector: {
    name: "std::vector",
    prerequisites: ["classes", "loops"],
    introducedBy: null,
    titleKeywords: ["std::vector"],
    contentKeywords: ["std::vector", "vector", "push_back", "capacity", "dynamic array"],
  },
  range_based_for: {
    name: "Range-based For Loops",
    prerequisites: ["std_vector", "loops", "references"],
    introducedBy: null,
    titleKeywords: ["range-based for", "for-each"],
    contentKeywords: ["range-based for", "for-each", "for (auto", "for (const auto"],
  },

  // ---- std::array and C-style arrays (Chapter 17) ----
  std_array: {
    name: "std::array",
    prerequisites: ["std_vector", "non_type_template_params"],
    introducedBy: null,
    titleKeywords: ["std::array"],
    contentKeywords: ["std::array", "fixed-size array"],
  },
  c_style_arrays: {
    name: "C-style Arrays",
    prerequisites: ["pointers", "std_array"],
    introducedBy: null,
    titleKeywords: ["c-style arrays"],
    contentKeywords: ["C-style array", "array decay", "pointer arithmetic"],
  },
  pointer_arithmetic: {
    name: "Pointer Arithmetic",
    prerequisites: ["pointers", "c_style_arrays"],
    introducedBy: null,
    titleKeywords: ["pointer arithmetic"],
    contentKeywords: ["pointer arithmetic", "subscript", "ptr + n", "ptr++"],
  },
  c_strings: {
    name: "C-style Strings",
    prerequisites: ["c_style_arrays", "chars"],
    introducedBy: null,
    titleKeywords: ["c-style strings"],
    contentKeywords: ["C-style string", "null terminator", "cstring"],
  },

  // ---- Iterators and Algorithms (Chapter 18) ----
  iterators: {
    name: "Iterators",
    prerequisites: ["std_vector", "pointers"],
    introducedBy: null,
    titleKeywords: ["introduction to iterators"],
    contentKeywords: ["iterator", "begin()", "end()", "std::begin", "std::end"],
  },
  algorithms: {
    name: "Standard Library Algorithms",
    prerequisites: ["iterators", "function_templates"],
    introducedBy: null,
    titleKeywords: ["standard library algorithms"],
    contentKeywords: [
      "std::sort",
      "std::find",
      "std::count",
      "std::for_each",
      "algorithm",
      "<algorithm>",
    ],
  },

  // ---- Dynamic Allocation (Chapter 19) ----
  dynamic_allocation: {
    name: "Dynamic Memory Allocation",
    prerequisites: ["pointers", "destructors"],
    introducedBy: null,
    titleKeywords: ["dynamic memory allocation", "new and delete"],
    contentKeywords: [
      "new",
      "delete",
      "heap",
      "dynamic allocation",
      "memory leak",
      "dangling pointer",
    ],
  },

  // ---- Advanced Functions (Chapter 20) ----
  function_pointers: {
    name: "Function Pointers",
    prerequisites: ["pointers", "functions"],
    introducedBy: null,
    titleKeywords: ["function pointers"],
    contentKeywords: ["function pointer", "callback"],
  },
  recursion: {
    name: "Recursion",
    prerequisites: ["functions", "loops"],
    introducedBy: null,
    titleKeywords: ["recursion"],
    contentKeywords: ["recursion", "recursive", "base case", "stack overflow"],
  },
  lambdas: {
    name: "Lambda Expressions",
    prerequisites: ["function_pointers", "auto_keyword"],
    introducedBy: null,
    titleKeywords: ["lambdas", "anonymous functions"],
    contentKeywords: ["lambda", "capture", "closure", "anonymous function", "capture list"],
  },

  // ---- Operator Overloading (Chapter 21) ----
  operator_overloading: {
    name: "Operator Overloading",
    prerequisites: ["classes", "friend_functions"],
    introducedBy: null,
    titleKeywords: ["operator overloading"],
    contentKeywords: [
      "operator overloading",
      "operator+",
      "operator<<",
      "operator>>",
      "operator==",
      "operator[]",
    ],
  },
  copy_assignment: {
    name: "Copy Assignment Operator",
    prerequisites: ["operator_overloading", "copy_constructor"],
    introducedBy: null,
    titleKeywords: ["overloading the assignment operator"],
    contentKeywords: ["operator=", "copy assignment", "self-assignment"],
  },
  deep_vs_shallow_copy: {
    name: "Deep vs Shallow Copying",
    prerequisites: ["copy_assignment", "dynamic_allocation"],
    introducedBy: null,
    titleKeywords: ["shallow vs. deep copying"],
    contentKeywords: ["deep copy", "shallow copy", "memberwise copy"],
  },

  // ---- Move Semantics and Smart Pointers (Chapter 22) ----
  rvalue_references: {
    name: "Rvalue References",
    prerequisites: ["lvalue_rvalue", "references"],
    introducedBy: null,
    titleKeywords: ["r-value references", "rvalue references"],
    contentKeywords: ["rvalue reference", "std::move"],
  },
  move_semantics: {
    name: "Move Semantics",
    prerequisites: ["rvalue_references", "copy_constructor"],
    introducedBy: null,
    titleKeywords: ["move constructors", "move assignment", "move semantics"],
    contentKeywords: [
      "move constructor",
      "move assignment",
      "std::move",
      "move semantics",
      "transfer ownership",
    ],
  },
  smart_pointers: {
    name: "Smart Pointers",
    prerequisites: ["dynamic_allocation", "move_semantics"],
    introducedBy: null,
    titleKeywords: ["smart pointers"],
    contentKeywords: ["smart pointer", "std::unique_ptr", "std::shared_ptr", "std::weak_ptr"],
  },
  unique_ptr: {
    name: "std::unique_ptr",
    prerequisites: ["smart_pointers"],
    introducedBy: null,
    titleKeywords: ["std::unique_ptr"],
    contentKeywords: ["unique_ptr", "std::make_unique", "exclusive ownership"],
  },
  shared_ptr: {
    name: "std::shared_ptr",
    prerequisites: ["smart_pointers"],
    introducedBy: null,
    titleKeywords: ["std::shared_ptr"],
    contentKeywords: ["shared_ptr", "std::make_shared", "reference counting", "shared ownership"],
  },
  weak_ptr: {
    name: "std::weak_ptr",
    prerequisites: ["shared_ptr"],
    introducedBy: null,
    titleKeywords: ["std::weak_ptr", "circular dependency"],
    contentKeywords: ["weak_ptr", "circular dependency", "expired"],
  },

  // ---- Object Relationships (Chapter 23) ----
  composition_aggregation: {
    name: "Composition and Aggregation",
    prerequisites: ["classes", "pointers"],
    introducedBy: null,
    titleKeywords: ["composition", "aggregation"],
    contentKeywords: ["composition", "aggregation", "has-a", "part-of", "whole-part"],
  },
  initializer_list: {
    name: "std::initializer_list",
    prerequisites: ["std_vector", "constructors"],
    introducedBy: null,
    titleKeywords: ["std::initializer_list"],
    contentKeywords: ["initializer_list", "std::initializer_list", "brace initialization"],
  },

  // ---- Inheritance (Chapter 24) ----
  inheritance: {
    name: "Inheritance",
    prerequisites: ["classes", "access_specifiers", "constructors"],
    introducedBy: null,
    titleKeywords: ["introduction to inheritance", "basic inheritance"],
    contentKeywords: [
      "inheritance",
      "derived class",
      "base class",
      "is-a",
      "extends",
      "parent class",
      "child class",
    ],
  },
  protected_access: {
    name: "Protected Access",
    prerequisites: ["inheritance", "access_specifiers"],
    introducedBy: null,
    titleKeywords: ["inheritance and access specifiers"],
    contentKeywords: ["protected", "protected member", "inheritance access"],
  },
  multiple_inheritance: {
    name: "Multiple Inheritance",
    prerequisites: ["inheritance"],
    introducedBy: null,
    titleKeywords: ["multiple inheritance"],
    contentKeywords: ["multiple inheritance", "diamond problem", "diamond inheritance"],
  },

  // ---- Virtual Functions (Chapter 25) ----
  virtual_functions: {
    name: "Virtual Functions",
    prerequisites: ["inheritance", "pointers", "references"],
    introducedBy: null,
    titleKeywords: ["virtual functions", "polymorphism"],
    contentKeywords: ["virtual", "polymorphism", "virtual function", "dynamic dispatch"],
  },
  override_final: {
    name: "Override and Final",
    prerequisites: ["virtual_functions"],
    introducedBy: null,
    titleKeywords: ["override and final"],
    contentKeywords: ["override", "final", "covariant return"],
  },
  virtual_destructors: {
    name: "Virtual Destructors",
    prerequisites: ["virtual_functions", "destructors"],
    introducedBy: null,
    titleKeywords: ["virtual destructors"],
    contentKeywords: ["virtual destructor"],
  },
  pure_virtual: {
    name: "Pure Virtual Functions / Abstract Classes",
    prerequisites: ["virtual_functions"],
    introducedBy: null,
    titleKeywords: ["pure virtual", "abstract base"],
    contentKeywords: [
      "pure virtual",
      "= 0",
      "abstract class",
      "abstract base class",
      "interface class",
    ],
  },
  object_slicing: {
    name: "Object Slicing",
    prerequisites: ["inheritance", "virtual_functions"],
    introducedBy: null,
    titleKeywords: ["object slicing"],
    contentKeywords: ["slicing", "object slicing"],
  },
  dynamic_cast: {
    name: "Dynamic Casting",
    prerequisites: ["virtual_functions", "pointers"],
    introducedBy: null,
    titleKeywords: ["dynamic casting"],
    contentKeywords: ["dynamic_cast", "RTTI", "runtime type"],
  },

  // ---- Templates and Classes (Chapter 26) ----
  template_specialization: {
    name: "Template Specialization",
    prerequisites: ["class_templates", "function_templates"],
    introducedBy: null,
    titleKeywords: ["template specialization", "partial template specialization"],
    contentKeywords: [
      "template specialization",
      "full specialization",
      "partial specialization",
      "template<>",
    ],
  },

  // ---- Exceptions (Chapter 27) ----
  exceptions: {
    name: "Exceptions",
    prerequisites: ["functions", "classes", "inheritance"],
    introducedBy: null,
    titleKeywords: ["exception handling", "exceptions"],
    contentKeywords: [
      "try",
      "catch",
      "throw",
      "exception",
      "stack unwinding",
      "std::exception",
      "std::runtime_error",
    ],
  },
  noexcept: {
    name: "Noexcept",
    prerequisites: ["exceptions"],
    introducedBy: null,
    titleKeywords: ["noexcept"],
    contentKeywords: ["noexcept", "exception specification", "nothrow"],
  },

  // ---- I/O (Chapter 28) ----
  file_io: {
    name: "File I/O",
    prerequisites: ["iostream", "classes", "strings"],
    introducedBy: null,
    titleKeywords: ["file i/o", "file io"],
    contentKeywords: [
      "fstream",
      "ifstream",
      "ofstream",
      "file I/O",
      "file input",
      "file output",
    ],
  },
  stream_classes: {
    name: "Stream Classes (stringstream)",
    prerequisites: ["iostream", "strings"],
    introducedBy: null,
    titleKeywords: ["stream classes for strings"],
    contentKeywords: ["stringstream", "istringstream", "ostringstream", "sstream"],
  },
};

// ---------------------------------------------------------------------------
// Known C++ factual error patterns
// ---------------------------------------------------------------------------

interface FactualPattern {
  regex: RegExp;
  concern: string;
  severity: "warning" | "info";
}

const FACTUAL_ERROR_PATTERNS: FactualPattern[] = [
  {
    regex: /references?\s+(can|may)\s+be\s+(null|nullptr|reassigned)/i,
    concern:
      "References cannot be null or reassigned after initialization. This is a common misconception.",
    severity: "warning",
  },
  {
    regex: /references?\s+are\s+(just|simply)\s+(pointers?|syntactic sugar for pointers?)/i,
    concern:
      "References are not simply pointers. They have different semantics: references must be initialized and cannot be reseated.",
    severity: "warning",
  },
  {
    regex: /arrays?\s+are\s+(just|simply)\s+pointers?/i,
    concern:
      "Arrays are not pointers. Arrays decay to pointers in certain contexts, but they are distinct types.",
    severity: "warning",
  },
  {
    regex: /new\s+is\s+(always\s+)?faster\s+than\s+stack/i,
    concern:
      "Stack allocation is generally faster than heap allocation (new), not the other way around.",
    severity: "warning",
  },
  {
    regex: /\bdelete\b.*\bdelete\b.*same\s+pointer/i,
    concern:
      "Double delete leads to undefined behavior. Each new should have exactly one matching delete.",
    severity: "warning",
  },
  {
    regex: /std::endl\s+is\s+(the\s+same\s+as|identical\s+to|equivalent\s+to)\s+['"]?\\n['"]?/i,
    concern:
      "std::endl flushes the buffer while \\n does not. They are not equivalent; prefer \\n for performance.",
    severity: "info",
  },
  {
    regex: /virtual\s+constructor/i,
    concern:
      "C++ does not have virtual constructors. The factory pattern or clone() can simulate this, but constructors cannot be virtual.",
    severity: "warning",
  },
  {
    regex: /structs?\s+(cannot|can't|don't)\s+have\s+(member\s+)?functions/i,
    concern:
      "Structs can have member functions in C++. The only difference from classes is default access level.",
    severity: "warning",
  },
  {
    regex: /pass\s+by\s+value\s+is\s+always\s+(slower|less\s+efficient)/i,
    concern:
      "Pass by value is not always slower. For small types it can be faster than pass by reference due to indirection overhead.",
    severity: "info",
  },
  {
    regex: /unique_ptr.*shared_ptr.*always\s+(prefer|use)\s+shared/i,
    concern:
      "std::unique_ptr should be the default smart pointer. std::shared_ptr has overhead (reference counting) and should only be used when shared ownership is needed.",
    severity: "warning",
  },
  {
    regex: /const\s+references?\s+(extend|prolong)\s+the\s+lifetime.*always/i,
    concern:
      "Const references only extend the lifetime of temporaries bound directly, not through function returns or nested temporaries.",
    severity: "warning",
  },
  {
    regex: /multiple\s+inheritance.*should\s+(always|generally)\s+be\s+used/i,
    concern:
      "Multiple inheritance should be used sparingly due to the diamond problem and complexity. Prefer composition or interfaces.",
    severity: "info",
  },
  {
    regex: /\bchar\b.*is\s+(always\s+)?8\s+bits/i,
    concern:
      "The C++ standard only guarantees that char is at least 8 bits. On exotic platforms it may be wider.",
    severity: "info",
  },
  {
    regex: /\bint\b.*is\s+(always\s+)?32\s+bits/i,
    concern:
      "The C++ standard only guarantees int is at least 16 bits. Its size is implementation-defined; use fixed-width types for portability.",
    severity: "info",
  },
  {
    regex: /signed\s+overflow\s+is\s+(well-defined|defined|wraps)/i,
    concern:
      "Signed integer overflow is undefined behavior in C++. Only unsigned overflow is well-defined (wraps around).",
    severity: "warning",
  },
  {
    regex: /\bstd::move\b.*moves/i,
    concern:
      "Potential misconception check: std::move does not actually move anything. It is merely a cast to an rvalue reference. The move happens in the move constructor/assignment.",
    severity: "info",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchLessonToConcept(lesson: FlatLesson, concept: ConceptDef): boolean {
  const titleLower = lesson.title.toLowerCase();
  return concept.titleKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));
}

function buildFlatLessons(data: SeedData): FlatLesson[] {
  const lessons: FlatLesson[] = [];
  for (const ch of data.chapters) {
    for (const lesson of ch.lessons) {
      lessons.push({
        number: lesson.number,
        title: lesson.learncpp_title,
        chapterNumber: ch.number,
        chapterTitle: ch.learncpp_title,
        globalOrder: lesson.global_sort_order,
      });
    }
  }
  lessons.sort((a, b) => a.globalOrder - b.globalOrder);
  return lessons;
}

function assignConceptsToLessons(lessons: FlatLesson[]): void {
  for (const [, concept] of Object.entries(CONCEPT_MAP)) {
    for (const lesson of lessons) {
      if (matchLessonToConcept(lesson, concept) && concept.introducedBy === null) {
        concept.introducedBy = lesson.number;
        break;
      }
    }
  }
}

function conceptUsedInText(text: string, concept: ConceptDef): boolean {
  const textLower = text.toLowerCase();
  return concept.contentKeywords.some((kw) => textLower.includes(kw.toLowerCase()));
}

function computeHealthScore(report: ValidationReport): number {
  const totalItems = report.summary.total_lessons + report.summary.concepts_mapped;
  const issues =
    report.summary.ordering_errors * 10 +
    report.summary.ordering_warnings * 3 +
    report.summary.forward_reference_errors * 8 +
    report.summary.forward_reference_warnings * 2 +
    report.summary.factual_concerns_count * 5 +
    report.summary.coverage_gaps_count * 2;

  const score = Math.max(0, Math.min(100, 100 - (issues / totalItems) * 100));
  return Math.round(score * 10) / 10;
}

function healthLabel(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 60) return "FAIR";
  if (score >= 40) return "NEEDS_ATTENTION";
  return "CRITICAL";
}

// ---------------------------------------------------------------------------
// Check 1: Curriculum ordering
// ---------------------------------------------------------------------------

function checkOrdering(lessons: FlatLesson[]): OrderingIssue[] {
  const issues: OrderingIssue[] = [];
  const lessonByNumber = new Map<string, FlatLesson>();
  for (const l of lessons) {
    lessonByNumber.set(l.number, l);
  }

  for (const [conceptId, concept] of Object.entries(CONCEPT_MAP)) {
    if (!concept.introducedBy) continue;
    const conceptLesson = lessonByNumber.get(concept.introducedBy);
    if (!conceptLesson) continue;

    for (const prereqId of concept.prerequisites) {
      const prereq = CONCEPT_MAP[prereqId];
      if (!prereq || !prereq.introducedBy) continue;
      const prereqLesson = lessonByNumber.get(prereq.introducedBy);
      if (!prereqLesson) continue;

      if (prereqLesson.globalOrder > conceptLesson.globalOrder) {
        issues.push({
          concept: conceptId,
          conceptName: concept.name,
          introducedInLesson: conceptLesson.number,
          introducedInTitle: conceptLesson.title,
          introducedAtOrder: conceptLesson.globalOrder,
          prerequisiteConcept: prereqId,
          prerequisiteName: prereq.name,
          prerequisiteLesson: prereqLesson.number,
          prerequisiteTitle: prereqLesson.title,
          prerequisiteAtOrder: prereqLesson.globalOrder,
          severity:
            prereqLesson.globalOrder - conceptLesson.globalOrder > 10 ? "error" : "warning",
          message: `"${concept.name}" (lesson ${conceptLesson.number}) depends on "${prereq.name}" (lesson ${prereqLesson.number}), but the prerequisite comes ${prereqLesson.globalOrder - conceptLesson.globalOrder} lessons later.`,
        });
      }
    }
  }

  return issues.sort((a, b) => a.introducedAtOrder - b.introducedAtOrder);
}

// ---------------------------------------------------------------------------
// Check 2: Coverage gaps
// ---------------------------------------------------------------------------

function checkCoverageGaps(): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const [conceptId, concept] of Object.entries(CONCEPT_MAP)) {
    if (!concept.introducedBy) {
      gaps.push({
        concept: conceptId,
        conceptName: concept.name,
        expectedInChapters: "unknown",
        severity: "warning",
        message: `Concept "${concept.name}" could not be mapped to any lesson by title. It may be implicitly covered or missing from the curriculum.`,
      });
    }
  }
  return gaps;
}

// ---------------------------------------------------------------------------
// Check 3: Forward references in generated content (DB mode)
// ---------------------------------------------------------------------------

interface DbLesson {
  id: string;
  number: string;
  learncpp_title: string;
  summary_md: string | null;
  sort_order: number;
}

interface DbExercise {
  id: string;
  lesson_id: string;
  title: string;
  prompt_md: string;
  starter_code: string;
  solution_code: string | null;
}

async function scanDatabaseContent(
  lessons: FlatLesson[],
): Promise<{
  forwardRefs: ForwardReference[];
  factualConcerns: FactualConcern[];
  lessonsWithSummaries: number;
  lessonsWithoutSummaries: number;
  exercisesScanned: number;
}> {
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --full mode",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all lessons with summaries
  const { data: dbLessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, number, learncpp_title, summary_md, sort_order")
    .order("sort_order", { ascending: true });

  if (lessonsError) {
    throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
  }

  // Fetch all exercises
  const { data: dbExercises, error: exercisesError } = await supabase
    .from("exercises")
    .select("id, lesson_id, title, prompt_md, starter_code, solution_code");

  if (exercisesError) {
    throw new Error(`Failed to fetch exercises: ${exercisesError.message}`);
  }

  const typedLessons = (dbLessons ?? []) as DbLesson[];
  const typedExercises = (dbExercises ?? []) as DbExercise[];

  const forwardRefs: ForwardReference[] = [];
  const factualConcerns: FactualConcern[] = [];

  const lessonsWithSummaries = typedLessons.filter((l) => l.summary_md).length;
  const lessonsWithoutSummaries = typedLessons.filter((l) => !l.summary_md).length;

  // Build lesson order lookup
  const lessonOrderMap = new Map<string, number>();
  const lessonIdToNumber = new Map<string, string>();
  for (const l of typedLessons) {
    lessonOrderMap.set(l.number, l.sort_order);
    lessonIdToNumber.set(l.id, l.number);
  }

  // Build concept -> first lesson order mapping
  const conceptIntroOrder = new Map<string, number>();
  for (const [conceptId, concept] of Object.entries(CONCEPT_MAP)) {
    if (concept.introducedBy) {
      const order = lessonOrderMap.get(concept.introducedBy);
      if (order !== undefined) {
        conceptIntroOrder.set(conceptId, order);
      }
    }
  }

  // Scan summaries for forward references and factual issues
  for (const lesson of typedLessons) {
    if (!lesson.summary_md) continue;

    const currentOrder = lesson.sort_order;

    // Check for forward references
    for (const [conceptId, concept] of Object.entries(CONCEPT_MAP)) {
      if (!concept.introducedBy) continue;
      const introOrder = conceptIntroOrder.get(conceptId);
      if (introOrder === undefined) continue;

      // Skip if this is the introducing lesson or an earlier lesson
      if (introOrder <= currentOrder) continue;

      // Check if the summary references this future concept
      if (conceptUsedInText(lesson.summary_md, concept)) {
        // Filter out very common terms that would cause false positives
        const isLikelyFalsePositive =
          concept.contentKeywords.every((kw) => kw.length <= 3) ||
          conceptId === "program_structure";

        if (!isLikelyFalsePositive) {
          forwardRefs.push({
            lessonNumber: lesson.number,
            lessonTitle: lesson.learncpp_title,
            lessonOrder: currentOrder,
            referencedConcept: conceptId,
            conceptName: concept.name,
            conceptIntroducedInLesson: concept.introducedBy,
            conceptIntroducedAtOrder: introOrder,
            foundIn: "summary",
            severity: introOrder - currentOrder > 20 ? "error" : "warning",
            message: `Lesson ${lesson.number} summary references "${concept.name}" which is not introduced until lesson ${concept.introducedBy} (${introOrder - currentOrder} lessons later).`,
          });
        }
      }
    }

    // Check for factual concerns
    for (const pattern of FACTUAL_ERROR_PATTERNS) {
      const match = pattern.regex.exec(lesson.summary_md);
      if (match) {
        factualConcerns.push({
          lessonNumber: lesson.number,
          lessonTitle: lesson.learncpp_title,
          pattern: pattern.regex.source,
          matchedText: match[0],
          concern: pattern.concern,
          severity: pattern.severity,
          foundIn: "summary",
        });
      }
    }
  }

  // Scan exercises
  for (const exercise of typedExercises) {
    const lessonNumber = lessonIdToNumber.get(exercise.lesson_id);
    if (!lessonNumber) continue;

    const currentOrder = lessonOrderMap.get(lessonNumber);
    if (currentOrder === undefined) continue;

    const flatLesson = lessons.find((l) => l.number === lessonNumber);
    const lessonTitle = flatLesson?.title ?? "Unknown";

    // Combine exercise text fields for scanning
    const exerciseText = [
      exercise.prompt_md,
      exercise.starter_code,
      exercise.solution_code ?? "",
    ].join("\n");

    // Check for forward references in exercises
    for (const [conceptId, concept] of Object.entries(CONCEPT_MAP)) {
      if (!concept.introducedBy) continue;
      const introOrder = conceptIntroOrder.get(conceptId);
      if (introOrder === undefined) continue;
      if (introOrder <= currentOrder) continue;

      if (conceptUsedInText(exerciseText, concept)) {
        const isLikelyFalsePositive =
          concept.contentKeywords.every((kw) => kw.length <= 3) ||
          conceptId === "program_structure";

        if (!isLikelyFalsePositive) {
          forwardRefs.push({
            lessonNumber,
            lessonTitle,
            lessonOrder: currentOrder,
            referencedConcept: conceptId,
            conceptName: concept.name,
            conceptIntroducedInLesson: concept.introducedBy,
            conceptIntroducedAtOrder: introOrder,
            foundIn: "exercise",
            exerciseTitle: exercise.title,
            severity: introOrder - currentOrder > 20 ? "error" : "warning",
            message: `Exercise "${exercise.title}" in lesson ${lessonNumber} uses "${concept.name}" which is not introduced until lesson ${concept.introducedBy}.`,
          });
        }
      }
    }

    // Check for factual concerns in exercises
    for (const pattern of FACTUAL_ERROR_PATTERNS) {
      const match = pattern.regex.exec(exerciseText);
      if (match) {
        factualConcerns.push({
          lessonNumber,
          lessonTitle,
          pattern: pattern.regex.source,
          matchedText: match[0],
          concern: pattern.concern,
          severity: pattern.severity,
          foundIn: "exercise",
          exerciseTitle: exercise.title,
        });
      }
    }
  }

  return {
    forwardRefs: forwardRefs.sort((a, b) => a.lessonOrder - b.lessonOrder),
    factualConcerns,
    lessonsWithSummaries,
    lessonsWithoutSummaries,
    exercisesScanned: typedExercises.length,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes("--full") ? "full" : "structure-only";

  if (!args.includes("--structure-only") && !args.includes("--full")) {
    console.error(
      "Usage: npx tsx scripts/validate_curriculum.ts [--structure-only | --full]",
    );
    console.error(
      "  --structure-only   Check curriculum_seed.json ordering (no DB required)",
    );
    console.error(
      "  --full             Also scan generated DB content for issues",
    );
    process.exit(1);
  }

  console.error(`\n[validate_curriculum] Mode: ${mode}`);
  console.error("[validate_curriculum] Loading curriculum_seed.json...");

  const seedPath = resolve(__dirname, "..", "curriculum_seed.json");
  const raw = readFileSync(seedPath, "utf-8");
  const data: SeedData = JSON.parse(raw);

  // Build flat lesson list
  const lessons = buildFlatLessons(data);
  console.error(
    `[validate_curriculum] Loaded ${lessons.length} lessons across ${data.chapters.length} chapters`,
  );

  // Assign concepts to lessons
  assignConceptsToLessons(lessons);
  const mappedConcepts = Object.values(CONCEPT_MAP).filter(
    (c) => c.introducedBy !== null,
  ).length;
  console.error(
    `[validate_curriculum] Mapped ${mappedConcepts}/${Object.keys(CONCEPT_MAP).length} concepts to lessons`,
  );

  // Check 1: Ordering
  console.error("[validate_curriculum] Checking prerequisite ordering...");
  const orderingIssues = checkOrdering(lessons);

  // Check 2: Coverage gaps
  console.error("[validate_curriculum] Checking coverage gaps...");
  const coverageGaps = checkCoverageGaps();

  // Build initial report
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    mode,
    ordering_issues: orderingIssues,
    forward_references: [],
    factual_concerns: [],
    coverage_gaps: coverageGaps,
    summary: {
      total_lessons: lessons.length,
      total_chapters: data.chapters.length,
      concepts_mapped: Object.keys(CONCEPT_MAP).length,
      concepts_with_lessons: mappedConcepts,
      ordering_errors: orderingIssues.filter((i) => i.severity === "error").length,
      ordering_warnings: orderingIssues.filter((i) => i.severity === "warning").length,
      forward_reference_errors: 0,
      forward_reference_warnings: 0,
      factual_concerns_count: 0,
      coverage_gaps_count: coverageGaps.length,
      health_score: 0,
      health_label: "",
    },
  };

  // Check 3: Database content (full mode only)
  if (mode === "full") {
    console.error("[validate_curriculum] Scanning database content...");
    try {
      const dbResults = await scanDatabaseContent(lessons);
      report.forward_references = dbResults.forwardRefs;
      report.factual_concerns = dbResults.factualConcerns;
      report.summary.forward_reference_errors = dbResults.forwardRefs.filter(
        (r) => r.severity === "error",
      ).length;
      report.summary.forward_reference_warnings = dbResults.forwardRefs.filter(
        (r) => r.severity === "warning",
      ).length;
      report.summary.factual_concerns_count = dbResults.factualConcerns.length;
      report.summary.lessons_with_summaries = dbResults.lessonsWithSummaries;
      report.summary.lessons_without_summaries = dbResults.lessonsWithoutSummaries;
      report.summary.exercises_scanned = dbResults.exercisesScanned;
      console.error(
        `[validate_curriculum] Scanned ${dbResults.lessonsWithSummaries} summaries and ${dbResults.exercisesScanned} exercises`,
      );
    } catch (err) {
      console.error(
        `[validate_curriculum] DB scan failed: ${(err as Error).message}`,
      );
      console.error(
        "[validate_curriculum] Continuing with structure-only results...",
      );
    }
  }

  // Compute health score
  report.summary.health_score = computeHealthScore(report);
  report.summary.health_label = healthLabel(report.summary.health_score);

  // Output JSON to stdout
  console.log(JSON.stringify(report, null, 2));

  // Summary to stderr for quick reading
  console.error("\n" + "=".repeat(60));
  console.error("CURRICULUM VALIDATION REPORT");
  console.error("=".repeat(60));
  console.error(`Mode:                    ${report.mode}`);
  console.error(`Lessons:                 ${report.summary.total_lessons}`);
  console.error(`Chapters:                ${report.summary.total_chapters}`);
  console.error(
    `Concepts mapped:         ${report.summary.concepts_with_lessons}/${report.summary.concepts_mapped}`,
  );
  console.error(`Ordering errors:         ${report.summary.ordering_errors}`);
  console.error(`Ordering warnings:       ${report.summary.ordering_warnings}`);
  if (mode === "full") {
    console.error(
      `Forward ref errors:      ${report.summary.forward_reference_errors}`,
    );
    console.error(
      `Forward ref warnings:    ${report.summary.forward_reference_warnings}`,
    );
    console.error(
      `Factual concerns:        ${report.summary.factual_concerns_count}`,
    );
    console.error(
      `Lessons with summaries:  ${report.summary.lessons_with_summaries ?? "N/A"}`,
    );
    console.error(
      `Exercises scanned:       ${report.summary.exercises_scanned ?? "N/A"}`,
    );
  }
  console.error(`Coverage gaps:           ${report.summary.coverage_gaps_count}`);
  console.error(
    `Health score:            ${report.summary.health_score}/100 (${report.summary.health_label})`,
  );
  console.error("=".repeat(60));

  // Print notable issues to stderr for quick scanning
  if (orderingIssues.length > 0) {
    console.error(`\nOrdering Issues (${orderingIssues.length}):`);
    for (const issue of orderingIssues.slice(0, 10)) {
      const icon = issue.severity === "error" ? "[ERROR]" : "[WARN] ";
      console.error(`  ${icon} ${issue.message}`);
    }
    if (orderingIssues.length > 10) {
      console.error(
        `  ... and ${orderingIssues.length - 10} more (see JSON output for full list)`,
      );
    }
  }

  if (coverageGaps.length > 0) {
    console.error(`\nCoverage Gaps (${coverageGaps.length}):`);
    for (const gap of coverageGaps.slice(0, 10)) {
      console.error(`  [GAP]  ${gap.message}`);
    }
    if (coverageGaps.length > 10) {
      console.error(
        `  ... and ${coverageGaps.length - 10} more (see JSON output for full list)`,
      );
    }
  }

  if (mode === "full" && report.forward_references.length > 0) {
    console.error(`\nForward References (${report.forward_references.length}):`);
    for (const ref of report.forward_references.slice(0, 10)) {
      const icon = ref.severity === "error" ? "[ERROR]" : "[WARN] ";
      console.error(`  ${icon} ${ref.message}`);
    }
    if (report.forward_references.length > 10) {
      console.error(
        `  ... and ${report.forward_references.length - 10} more (see JSON output for full list)`,
      );
    }
  }

  if (mode === "full" && report.factual_concerns.length > 0) {
    console.error(`\nFactual Concerns (${report.factual_concerns.length}):`);
    for (const concern of report.factual_concerns.slice(0, 10)) {
      console.error(
        `  [${concern.severity.toUpperCase()}]  Lesson ${concern.lessonNumber}: ${concern.concern}`,
      );
      console.error(`         Matched: "${concern.matchedText}"`);
    }
  }

  console.error("");

  // Exit with non-zero if there are errors
  const hasErrors =
    report.summary.ordering_errors > 0 ||
    report.summary.forward_reference_errors > 0;
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
