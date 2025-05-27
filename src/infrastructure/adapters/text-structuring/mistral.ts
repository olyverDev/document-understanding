import { Mistral } from "@mistralai/mistralai";
import type { ChatCompletionStreamRequestMessages } from "@mistralai/mistralai/models/components";
import { z as Zod } from "zod";

import { TextStructuringError } from "../../../errors/text-structuring";
import type { TextStructuring } from "../../../ports/text-structuring.interface";
import { getMistralSingletonClient } from "../../api/mistral-client";

interface MistralTextStructuringConfig {
  model: string;
}

interface MistralTextStructuringContext {
  prompt: string;
  outputSchema: Zod.ZodTypeAny;
}

export class MistralTextStructuring<T> implements TextStructuring<T, MistralTextStructuringContext> {
  private readonly modelName: string;

  constructor(
    private readonly client: Mistral,
    config: MistralTextStructuringConfig
  ) {
    this.modelName = config.model;
  }

  async parse(text: string, {
    prompt,
    outputSchema,
  }: MistralTextStructuringContext): Promise<T> {
    const messages: ChatCompletionStreamRequestMessages[] = [
      {
        role: "system",
        content: [
          { type: "text", text: prompt },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `### File content in Markdown: ${text}`,
          },
        ],
      },
    ];

    try {
      const chatResponse = await this.client.chat.parse({
        model: this.modelName,
        messages,
        responseFormat: outputSchema,
      });

      const parsedOutput = chatResponse?.choices?.[0]?.message?.parsed;

      if (!parsedOutput) {
        throw new TextStructuringError('Expected Mistral LLM output to be fulfilled.');
      }

      return parsedOutput as T;
    } catch (error) {
      if (error instanceof TextStructuringError) {
        throw error;
      }

      const isJSONParseError = error instanceof SyntaxError;
      const message = isJSONParseError
        ? 'Failed to parse Mistral LLM response as JSON'
        : (error as Error)?.message;

      throw new TextStructuringError(message, error);
    }
  }
}

export type MistralTextStructuringFactoryConfig = {
  apiKey: string;
  model?: string;
};

export const MistralTextStructuringFactory = <T>(
  config: MistralTextStructuringFactoryConfig
): TextStructuring<T, MistralTextStructuringContext> => {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralTextStructuring<T>(client, {
    model: config.model ?? 'mistral-medium-latest',
  });
};
