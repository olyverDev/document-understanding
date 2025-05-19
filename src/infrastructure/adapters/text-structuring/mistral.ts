import { Mistral } from "@mistralai/mistralai";
import type { ContentChunk, JsonSchema } from "@mistralai/mistralai/models/components";

import { TextStructuringError } from "../../../errors/text-structuring";
import type { TextStructuring } from "../../../ports/text-structuring";
import { getMistralSingletonClient } from "../../api/mistral-client";

interface MistralTextStructuringConfig {
  model: string;
}

export class MistralTextStructuring<T> implements TextStructuring<T> {
  private readonly modelName: string;

  constructor(
    private readonly client: Mistral,
    config: MistralTextStructuringConfig
  ) {
    this.modelName = config.model;
  }

  async parse({
    text,
    prompt,
    outputSchema = null,
  }: {
    prompt: string;
    text: string | null;
    outputSchema?: JsonSchema['schemaDefinition'] | null;
  }): Promise<T> {
    const messageContent: ContentChunk[] = [
      { type: "text", text: prompt },
      {
        type: "text",
        text: `### File content in Markdown: ${text}`,
      },
    ];

    try {
      const chatResponse = await this.client.chat.complete({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        responseFormat: outputSchema ? {
          type: 'json_schema',
          jsonSchema: {
            strict: true,
            schemaDefinition: outputSchema,
            name: outputSchema.title,
            description: outputSchema.description,
          },
        } : {
          type: 'json_object'
        },
      });

      const rawOutput = chatResponse?.choices?.[0].message?.content;

      if (typeof rawOutput !== 'string') {
        throw new TextStructuringError('Expected Mistral LLM output to be string.');
      }

      const parsedOutput = JSON.parse(rawOutput);

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
): TextStructuring<T> => {
  const client = getMistralSingletonClient({ apiKey: config.apiKey });
  return new MistralTextStructuring<T>(client, {
    model: config.model ?? 'mistral-small-latest',
  });
};
