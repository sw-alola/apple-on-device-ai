import { getNativeModule } from "./native-loader";

// Initialize native module using robust loader
const native = getNativeModule();

// Types for our Apple AI library
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ModelAvailability {
  available: boolean;
  reason: string;
}

// OpenAI-compatible response types
export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: "assistant";
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
}

/**
 * Apple AI library for accessing on-device foundation models
 */
export class AppleAISDK {
  /** Check availability of Apple Intelligence */
  async checkAvailability(): Promise<ModelAvailability> {
    return native.checkAvailability();
  }

  /** Get supported languages */
  getSupportedLanguages(): string[] {
    return native.getSupportedLanguages();
  }

  /** Generate a response for a prompt */
  async generateResponse(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    return native.generateResponse(
      prompt,
      options.temperature ?? undefined,
      options.maxTokens ?? undefined
    );
  }

  /** Generate a response using conversation history */
  async generateResponseWithHistory(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): Promise<string> {
    const messagesJson = JSON.stringify(messages);
    return native.generateResponseWithHistory(
      messagesJson,
      options.temperature ?? undefined,
      options.maxTokens ?? undefined
    );
  }

  /**
   * Stream chat completion as async generator yielding OpenAI-compatible chunks
   */
  streamChatCompletion(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): AsyncIterableIterator<ChatCompletionChunk> {
    const completionId = `chatcmpl-${crypto.randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    const queue: ChatCompletionChunk[] = [];
    let done = false;
    let isFirstChunk = true;

    // Pending promise controls for consumer awaiting next chunk
    let pendingResolve:
      | ((value: IteratorResult<ChatCompletionChunk>) => void)
      | null = null;
    let pendingReject: ((reason?: any) => void) | null = null;

    let error: any = null;

    // Push-based native callback
    const handleChunk = (err: any, chunk?: string | null) => {
      if (err) {
        error = err;
        done = true;
        if (pendingReject) {
          pendingReject(err);
          pendingResolve = null;
          pendingReject = null;
        }
        return;
      }

      let chatChunk: ChatCompletionChunk;

      if (chunk == null || chunk === "") {
        // Final chunk
        chatChunk = {
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model: "apple-on-device",
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: "stop",
            },
          ],
        };
        done = true;
      } else {
        // Content chunk
        chatChunk = {
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model: "apple-on-device",
          choices: [
            {
              index: 0,
              delta: {
                ...(isFirstChunk ? { role: "assistant" as const } : {}),
                content: chunk,
              },
              finish_reason: null,
            },
          ],
        };
        isFirstChunk = false;
      }

      // If the consumer is waiting, resolve immediately; otherwise buffer
      if (pendingResolve) {
        pendingResolve({ value: chatChunk, done: false });
        pendingResolve = null;
        pendingReject = null;
      } else {
        queue.push(chatChunk);
      }
    };

    // Use the existing streaming mechanism but with messages
    const messagesJson = JSON.stringify(messages);
    native.generateResponseStreamWithHistory?.(
      messagesJson,
      options.temperature ?? undefined,
      options.maxTokens ?? undefined,
      handleChunk
    ) ??
      (() => {
        // Fallback: if streaming with history isn't available, convert the prompt and use regular streaming
        const prompt =
          messages.map((m) => `${m.role}: ${m.content}`).join("\n") +
          "\nassistant:";
        native.generateResponseStream(
          prompt,
          options.temperature ?? undefined,
          options.maxTokens ?? undefined,
          handleChunk
        );
      })();

    return {
      next(): Promise<IteratorResult<ChatCompletionChunk>> {
        if (queue.length > 0) {
          const value = queue.shift()!;
          return Promise.resolve({ value, done: false });
        }
        if (done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        if (error) {
          return Promise.reject(error);
        }
        // Wait for the next chunk
        return new Promise<IteratorResult<ChatCompletionChunk>>(
          (resolve, reject) => {
            pendingResolve = resolve;
            pendingReject = reject;
          }
        );
      },
      async return(): Promise<IteratorResult<ChatCompletionChunk>> {
        done = true;
        return { value: undefined, done: true };
      },
      async throw(err?: any): Promise<IteratorResult<ChatCompletionChunk>> {
        done = true;
        throw err;
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }

  /** OpenAI-style helper with streaming support */
  createChatCompletion<T extends boolean = false>(params: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    model?: string;
    stream?: T;
  }): T extends true
    ? AsyncIterableIterator<ChatCompletionChunk>
    : Promise<ChatCompletionResponse>;

  // Overload for explicit non-streaming
  createChatCompletion(params: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    model?: string;
    stream?: false;
  }): Promise<ChatCompletionResponse>;

  // Overload for explicit streaming
  createChatCompletion(params: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    model?: string;
    stream: true;
  }): AsyncIterableIterator<ChatCompletionChunk>;

  // Implementation
  createChatCompletion(params: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    model?: string;
    stream?: boolean;
  }):
    | Promise<ChatCompletionResponse>
    | AsyncIterableIterator<ChatCompletionChunk> {
    if (params.stream === true) {
      return this.streamChatCompletion(params.messages, {
        temperature: params.temperature,
        maxTokens: params.max_tokens,
      });
    }

    // Non-streaming response
    return this.generateResponseWithHistory(params.messages, {
      temperature: params.temperature,
      maxTokens: params.max_tokens,
    }).then((content) => ({
      id: `chatcmpl-${crypto.randomUUID()}`,
      object: "chat.completion" as const,
      created: Math.floor(Date.now() / 1000),
      model: "apple-on-device",
      choices: [
        {
          index: 0,
          message: { role: "assistant" as const, content },
          finish_reason: "stop",
        },
      ],
    }));
  }

  /**
   * Stream response as async generator yielding string chunks (deltas)
   */
  streamResponse(
    prompt: string,
    options: GenerationOptions = {}
  ): AsyncIterableIterator<string> {
    const queue: string[] = [];
    let done = false;

    // Pending promise controls for consumer awaiting next chunk
    let pendingResolve: ((value: IteratorResult<string>) => void) | null = null;
    let pendingReject: ((reason?: any) => void) | null = null;

    let error: any = null;

    // Push-based native callback
    const handleChunk = (err: any, chunk?: string | null) => {
      if (err) {
        error = err;
        done = true;
        if (pendingReject) {
          pendingReject(err);
          pendingResolve = null;
          pendingReject = null;
        }
        return;
      }

      if (chunk == null || chunk === "") {
        done = true;
        if (pendingResolve) {
          pendingResolve({ value: undefined, done: true });
          pendingResolve = null;
        }
        return;
      }

      // If the consumer is waiting, resolve immediately; otherwise buffer
      if (pendingResolve) {
        pendingResolve({ value: chunk, done: false });
        pendingResolve = null;
        pendingReject = null;
      } else {
        queue.push(chunk);
      }
    };

    native.generateResponseStream(
      prompt,
      options.temperature ?? undefined,
      options.maxTokens ?? undefined,
      handleChunk
    );

    return {
      next(): Promise<IteratorResult<string>> {
        if (queue.length > 0) {
          const value = queue.shift()!;
          return Promise.resolve({ value, done: false });
        }
        if (done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        if (error) {
          return Promise.reject(error);
        }
        // Wait for the next chunk
        return new Promise<IteratorResult<string>>((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
        });
      },
      async return(): Promise<IteratorResult<string>> {
        done = true;
        return { value: undefined, done: true };
      },
      async throw(err?: any): Promise<IteratorResult<string>> {
        done = true;
        throw err;
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }
}

export const appleAISDK = new AppleAISDK();
