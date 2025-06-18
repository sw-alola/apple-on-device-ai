# [Unofficial] Apple Foundation Models binding for NodeJS

## 🔥🔥🔥 Supports [Vercel AI SDK](https://ai-sdk.dev/)

## Features

- 🍎 **Apple Intelligence Integration**: Direct access to Apple's on-device models
- 🧠 **Dual API Support**: Use either the native Apple AI interface or Vercel AI SDK
- 🌊 **Streaming Support**: Real-time response streaming with OpenAI-compatible chunks
- 🎯 **Object Generation**: Structured data generation with Zod schemas
- 💬 **Chat Interface**: OpenAI-style chat completions with message history
- 🔄 **Cross-Platform**: Works with React, Next.js, Vue, Svelte, and Node.js
- 📝 **TypeScript**: Full type safety and excellent DX

## Installation

```bash
# Using bun (recommended)
bun add @meridius-labs/apple-on-device-ai

# Assumming you don't have these
bun add ai zod
```

## Quick Start

### Native Apple AI Interface

```typescript
import { appleAISDK } from "@meridius-labs/apple-on-device-ai";

// (non streaming) Simple text generation
const response = await appleAISDK.generateResponse(
  "What is the capital of France?",
  { temperature: 0.7, maxTokens: 100 }
);

// (non streaming) Chat with message history
const chatResponse = await appleAISDK.generateResponseWithHistory([
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello!" },
]);

// Streaming responses
for await (const chunk of appleAISDK.streamResponse("Tell me a story")) {
  process.stdout.write(chunk);
}
```

### <img width="24" height="24" src="https://vercel.com/favicon.ico" /> Vercel AI SDK Integration

```typescript
import { generateText, streamText, generateObject } from "ai";
import { appleAI } from "@meridius-labs/apple-on-device-ai";
import { z } from "zod";

// Text generation with AI SDK
const { text } = await generateText({
  model: appleAI("apple-on-device"),
  prompt: "Explain quantum computing",
  temperature: 0.7,
});

// Streaming with AI SDK
const result = streamText({
  model: appleAI("apple-on-device"),
  prompt: "Write a poem about technology",
});

for await (const delta of result.textStream) {
  process.stdout.write(delta);
}

// Structured object generation
const { object } = await generateObject({
  model: appleAI("apple-on-device"),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  prompt: "Generate a chocolate chip cookie recipe",
});
```

## React/Next.js Integration

```tsx
import { useChat } from "ai/react";
import { appleAI } from "@meridius-labs/apple-on-device-ai";

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat", // Your API endpoint using appleAI
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

```typescript
// app/api/chat/route.ts
import { appleAI } from "@meridius-labs/apple-on-device-ai";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: appleAI("apple-on-device"),
    messages,
  });

  return result.toDataStreamResponse();
}
```

## Requirements

- **macOS 26+** with Apple Intelligence enabled
- **Compatible Apple Silicon**: M1, M2, M3, or M4 chips
- **Device Language**: Set to supported language (English, Spanish, French, etc.)
- **Sufficient Storage**: At least 4GB available space for model files

## API Reference

### Core Methods for `appleAISDK`

#### `generateResponse(prompt, options?)`

Generate a simple text response.

#### `generateResponseWithHistory(messages, options?)`

Generate response with conversation context.

#### `streamResponse(prompt, options?)`

Stream response chunks in real-time.

#### `createChatCompletion(params)`

OpenAI-style chat completions with optional streaming.

#### `checkAvailability()`

Check if Apple Intelligence is available.

#### `getSupportedLanguages()`

Get list of supported languages.

### Vercel AI SDK Provider

The library includes a full Vercel AI SDK provider:

```typescript
import { appleAI, createAppleAI } from "@meridius-labs/apple-on-device-ai";

// Use default provider
const model = appleAI("apple-on-device");

// Create custom provider
const customProvider = createAppleAI({
  headers: { "Custom-Header": "value" },
});
```

### Options

```typescript
interface GenerationOptions {
  temperature?: number; // 0.0 to 1.0 (default: 0.7)
  maxTokens?: number; // Maximum tokens to generate
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}
```

## Examples

See the `/examples` directory for complete implementations:

- Basic text generation
- Streaming responses
- Chat interfaces
- Object generation
- Next.js integration
- React components

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see LICENSE file for details.
