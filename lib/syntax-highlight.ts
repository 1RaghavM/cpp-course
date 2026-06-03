import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.registerLanguage("cpp", cpp);

export { SyntaxHighlighter, oneDark };
