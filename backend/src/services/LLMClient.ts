import { config } from "../config/env";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface JsonSchema<T> {
  parse(data: unknown): T;
}

export interface LLMCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export class LLMClient {
  private provider: string;
  private apiKey: string;

  constructor() {
    this.provider = config.llm.provider;
    this.apiKey =
      this.provider === "anthropic"
        ? config.llm.anthropicApiKey
        : config.llm.openaiApiKey;
  }

  /**
   * Check if LLM is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Complete a prompt with the configured LLM
   */
  async complete(
    systemPrompt: string,
    userMessage: string,
    options: LLMCompletionOptions = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("LLM not configured - set API key in environment");
    }

    const { maxTokens = 1000, temperature = 0.7 } = options;
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.doComplete(systemPrompt, userMessage, maxTokens, temperature);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await this.delay(1000 * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("LLM completion failed");
  }

  /**
   * Complete and parse JSON response against schema
   */
  async completeJSON<T>(
    systemPrompt: string,
    userMessage: string,
    schema: JsonSchema<T>
  ): Promise<T> {
    const response = await this.complete(
      `${systemPrompt}\n\nRespond with valid JSON only.`,
      userMessage,
      { temperature: 0.3 }
    );

    const parsed = JSON.parse(response);
    return schema.parse(parsed);
  }

  /**
   * Stream tokens from the configured provider
   */
  async *stream(systemPrompt: string, userMessage: string): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error("LLM not configured - set API key in environment");
    }

    if (this.provider !== "openai") {
      yield await this.complete(systemPrompt, userMessage);
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`OpenAI streaming error: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.trim();
        if (!line || line === "data: [DONE]") continue;
        if (!line.startsWith("data:")) continue;

        const payload = JSON.parse(line.replace("data:", "").trim());
        const delta = payload.choices?.[0]?.delta;
        if (!delta) continue;

        const content = delta.content;
        if (typeof content === "string") {
          yield content;
        } else if (Array.isArray(content)) {
          for (const chunk of content) {
            if (chunk?.text) {
              yield chunk.text;
            }
          }
        }
      }
    }
  }

  /**
   * Complete with OpenAI
   */
  private async completeWithOpenAI(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * Complete with Anthropic
   */
  private async completeWithAnthropic(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  }

  private async doComplete(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    if (this.provider === "anthropic") {
      return this.completeWithAnthropic(systemPrompt, userMessage, maxTokens, temperature);
    }
    return this.completeWithOpenAI(systemPrompt, userMessage, maxTokens, temperature);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Chat with message history
   */
  async chat(
    systemPrompt: string,
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("LLM not configured");
    }

    // For now, just use the last user message
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message provided");
    }

    return this.complete(systemPrompt, lastUserMessage.content, options);
  }
}
