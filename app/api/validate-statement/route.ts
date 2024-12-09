import { validatedStatementSchema,  } from "@/utils/schemas";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const perplexity = createOpenAI({
  name: "perplexity",
  apiKey: process.env.PERPLEXITY_API_KEY ?? "",
  baseURL: "https://api.perplexity.ai/",
});

const generateCheckablePrompt = (statement: string, transcript?: string) => {
  return `
  Categorize this statement as one of:
  immediately-checkable - Can be verified using general knowledge (e.g. "Water freezes at 0°C", "Earth orbits the Sun")
  needs-more-info - Requires additional context or current data (e.g. "It's raining now", "Sarah works at Google", "The stock market is up today")
  not-checkable - Conversational/greetings (e.g. "How are you?", "I love pizza")

  Statement: "${statement}"${transcript ? `\n\nConversation context in case subject of statement is ambigious. Infer from here:\n${transcript.concat(" " + statement)}` : ""}
`;
};

const generatePrompt = (
  statement: string,
  transcript?: string,
  additionalInfo?: string,
) => {
  return `Analyze the content for signs of false or misleading information. Use 'dubious' as the classification if the statement seems questionable but you're not certain, or 'obviously-fake' if it contains verifiably false claims. Provide one short sentence explaining your reasoning, using only information that would have been available at the time of the conversation. Slight spelling mistakes are ok and not considered a fake statement. If a statement is highly unlikely, classify it as obviously fake.
  Example:
  - Statement: "The moon is made of cheese."
  - Classification: "obviously-fake"

  Statement to analyze: "${statement}"${additionalInfo ? `\n\nUse the following additional information to guide your response:\n${additionalInfo}` : ""}${transcript ? `\n\nConversation context in case subject of statement is ambigious (infer subject from this trascript, but ignore previous contradictory statements):\n${transcript.concat(" " + statement)}` : ""}
  `;
};

const generatePerplexityPrompt = (statement: string, transcript?: string) => {
  return `Analyze this statement and determine if it is true, dubious (questionable but not certain), or obviously fake. Provide a single sentence response in the format: "The statement is [true/dubious/obviously-fake] because [brief reason]." Do not provide sources. Slight spelling mistakes are ok and not considered a fake statement.

Statement: "${statement}"${transcript ? `\n\nConversation context in case subject of statement is ambigious (infer subject from this trascript, but ignore previous contradictory statements):\n${transcript.concat(" " + statement)}` : ""}

Note: Today's day is ${new Date().toISOString()} if relevant.
`;
};

export const POST = async (request: Request) => {
  const { statement, transcript: transcriptRaw } = await request.json();

  const hasAmbiguiousSubject = (text: string): boolean => {
    const ambiguousWords = [
      "they",
      "he",
      "she",
      "it",
      "they're",
      "he's",
      "she's",
      "it's",
      "their",
      "his",
      "hers",
      "its",
      "I",
    ];
    const lowercaseText = text.toLowerCase();
    return ambiguousWords.some((word) => lowercaseText.includes(word));
  };
  const transcript = hasAmbiguiousSubject(statement)
    ? transcriptRaw
    : undefined;

  if (!statement) {
    return NextResponse.json(
      { error: "No statement provided" },
      { status: 400 },
    );
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: generateCheckablePrompt(statement, transcript),
    schema: z.object({
      checkableType: z
        .enum(["not-checkable", "immediately-checkable", "needs-more-info"])
        .describe(
          "If the statement is not checkable (eg. random talking), easily-checkable (eg. the earth is flat), requires-additional-information (eg. x person works at y company).",
        ),
    }),
  });

  if (object.checkableType === "not-checkable") {
    return NextResponse.json({
      statement,
      type: "not-checkable",
      reasoning: "This statement is not a checkable claim",
    });
  }

  let additionalInfo: string | undefined = undefined;
  if (object.checkableType === "needs-more-info") {
    const { text: perplexityCheck } = await generateText({
      model: perplexity("llama-3.1-sonar-small-128k-online"),
      maxTokens: 100,
      prompt: generatePerplexityPrompt(statement, transcript),
    });
    additionalInfo = perplexityCheck;
  }

  const { object: generation } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: validatedStatementSchema,
    prompt: generatePrompt(statement, transcript, additionalInfo),
  });

  return NextResponse.json({ statement, type: "checkable", ...generation });
};
