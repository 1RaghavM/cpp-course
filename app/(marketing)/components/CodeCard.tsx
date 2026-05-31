import { codeToHtml } from "shiki";

const HERO_CODE = `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> topics = {
        "variables", "functions",
        "pointers",  "templates"
    };

    for (const auto& topic : topics) {
        std::cout << "Learning: " << topic << "\\n";
    }

    return 0;
}`;

export async function CodeCard() {
  const html = await codeToHtml(HERO_CODE, {
    lang: "cpp",
    theme: "github-dark",
  });

  return (
    <div className="code-card">
      <div className="code-card-header">
        <span className="code-card-tab">main.cpp</span>
      </div>
      <div className="code-card-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
