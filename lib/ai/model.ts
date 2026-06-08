import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { google } from "@ai-sdk/google";

export function tutorModel(apiKey?: string) {
  if (apiKey) {
    const userGoogle = createGoogleGenerativeAI({ apiKey });
    return userGoogle("gemini-2.5-flash");
  }
  return google("gemini-2.5-flash");
}
