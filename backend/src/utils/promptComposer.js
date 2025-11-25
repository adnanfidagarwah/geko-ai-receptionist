import generalPromptTemplate from "../prompts/generalPromptTemplate.js";
import { buildPromptContext, renderTemplate } from "./promptContext.js";

export function composePromptFromOnboarding({ clinic, onboarding }) {
  const context = buildPromptContext({ clinic, onboarding });
  return renderTemplate(generalPromptTemplate, context);
}
