import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function tutorModel(apiKey: string) {
  const userGoogle = createGoogleGenerativeAI({ apiKey });
  return userGoogle("gemini-2.5-flash");
}
