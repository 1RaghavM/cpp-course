import { describe, it, expect } from "vitest";
import {
  findForbiddenUsages,
  FORBIDDEN_BY_STAGE,
} from "@/lib/capstones/forbidden-symbols";

describe("FORBIDDEN_BY_STAGE", () => {
  it("declares forbidden symbols for every stage except advanced", () => {
    expect(FORBIDDEN_BY_STAGE.basics.length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE["memory-oop"].length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE["stl-templates"].length).toBeGreaterThan(0);
    expect(FORBIDDEN_BY_STAGE.advanced).toEqual([]);
  });
});

describe("findForbiddenUsages — basics", () => {
  it("flags std::vector in basics", () => {
    const hits = findForbiddenUsages("basics", "std::vector<int> v;");
    expect(hits.map((h) => h.label)).toContain("std::vector");
  });

  it("flags class declaration in basics", () => {
    const hits = findForbiddenUsages("basics", "class Foo { };");
    expect(hits.map((h) => h.label)).toContain("class declaration");
  });

  it("flags new / delete in basics", () => {
    const hits = findForbiddenUsages("basics", "int* p = new int(5); delete p;");
    const labels = hits.map((h) => h.label);
    expect(labels).toContain("new expression");
    expect(labels).toContain("delete expression");
  });

  it("does not flag plain main + cout in basics", () => {
    const code = `#include <iostream>
int main() {
  int x = 0;
  std::cin >> x;
  std::cout << x << '\\n';
  return 0;
}`;
    expect(findForbiddenUsages("basics", code)).toEqual([]);
  });
});

describe("findForbiddenUsages — memory-oop", () => {
  it("flags std::vector in memory-oop", () => {
    const hits = findForbiddenUsages("memory-oop", "std::vector<int> v;");
    expect(hits.map((h) => h.label)).toContain("std::vector");
  });

  it("allows class declaration in memory-oop", () => {
    expect(findForbiddenUsages("memory-oop", "class Foo { };")).toEqual([]);
  });
});

describe("findForbiddenUsages — stl-templates", () => {
  it("flags std::unique_ptr in stl-templates", () => {
    const hits = findForbiddenUsages(
      "stl-templates",
      "std::unique_ptr<int> p;",
    );
    expect(hits.map((h) => h.label)).toContain("std::unique_ptr");
  });

  it("allows std::vector in stl-templates", () => {
    expect(findForbiddenUsages("stl-templates", "std::vector<int> v;")).toEqual([]);
  });
});

describe("findForbiddenUsages — advanced", () => {
  it("flags nothing in advanced", () => {
    const code = `
#include <vector>
#include <memory>
class A { virtual void f() = 0; };
class B : public A { void f() override {} };
std::unique_ptr<A> p;
std::vector<int> v;
    `;
    expect(findForbiddenUsages("advanced", code)).toEqual([]);
  });
});

describe("findForbiddenUsages — ignores string literals and line comments", () => {
  it("does not flag 'class' inside a string literal in basics", () => {
    expect(findForbiddenUsages("basics", `puts("class Foo");`)).toEqual([]);
  });

  it("does not flag 'new' inside a // line comment in basics", () => {
    expect(findForbiddenUsages("basics", `// new is not yet introduced\nint x = 0;`)).toEqual([]);
  });
});
