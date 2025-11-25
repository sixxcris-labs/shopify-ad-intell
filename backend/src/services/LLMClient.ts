import { config } from "../config/env";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionOptions {
  maxTokens?: number;
  temperature?: number;
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

    if (this.provider === "anthropic") {
      return this.completeWithAnthropic(systemPrompt, userMessage, maxTokens, temperature);
    } else {
      return this.completeWithOpenAI(systemPrompt, userMessage, maxTokens, temperature);
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
