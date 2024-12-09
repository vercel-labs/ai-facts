import { z } from "zod";

export const validatedStatementSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "Explain your reasoning for classifying the statement as true, dubious or obviously-fake. If the statement is not-checkable, return null.",
    )
    .nullable(),
  accuracy: z
    .enum(["dubious", "obviously-fake", "true"])
    .nullable()
    .describe("If the statement is not-checkable, return null"),
});

export const validatedStatementResultSchema = validatedStatementSchema.extend({
  statement: z.string(),
  type: z
    .enum(["checkable", "non-checkable"])
    .describe(
      "Whether the statement needs fact-checking. If the statement is a greeting, random talking or other non-checkable phrase, set this to 'non-checkable'.",
    ),
});

export type ValidatedStatement = z.infer<typeof validatedStatementResultSchema>;

export interface Statement {
  text: string;
  timestamp: number;
  index: number;
  processed: boolean;
  result?: ValidatedStatement;
}
