# Usage Example for @meridius-labs/apple-on-device-ai

## Installation

```bash
# Install the scoped package
npm install @meridius-labs/apple-on-device-ai

# Or with Bun
bun add @meridius-labs/apple-on-device-ai
```

## Basic Usage

### Import the Library

```typescript
// ESM import
import { appleAI, createAppleAI } from "@meridius-labs/apple-on-device-ai";

// CommonJS require
const { appleAI, createAppleAI } = require("@meridius-labs/apple-on-device-ai");
```

### Simple Text Generation

```typescript
import { appleAISDK } from "@meridius-labs/apple-on-device-ai";

// Check if Apple Intelligence is available
const availability = await appleAISDK.checkAvailability();
if (!availability.available) {
  console.error("Apple Intelligence not available:", availability.reason);
  process.exit(1);
}

// Generate text
const response = await appleAISDK.generateResponse(
  "Write a haiku about TypeScript"
);
console.log(response);
```

### Vercel AI SDK Integration

```typescript
import { generateText } from "ai";
import { createAppleAI } from "@meridius-labs/apple-on-device-ai";

const apple = createAppleAI();

const { text } = await generateText({
  model: apple("apple-on-device"),
  prompt: "Explain quantum computing in simple terms",
});

console.log(text);
```

### Streaming Response

```typescript
import { streamText } from "ai";
import { createAppleAI } from "@meridius-labs/apple-on-device-ai";

const apple = createAppleAI();

const { textStream } = await streamText({
  model: apple("apple-on-device"),
  prompt: "Write a story about a robot learning to paint",
});

for await (const delta of textStream) {
  process.stdout.write(delta);
}
```

### Chat Conversations

```typescript
import { generateText } from "ai";
import { createAppleAI } from "@meridius-labs/apple-on-device-ai";

const apple = createAppleAI();

const { text } = await generateText({
  model: apple("apple-on-device"),
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" },
    { role: "assistant", content: "The capital of France is Paris." },
    { role: "user", content: "What is its population?" },
  ],
});

console.log(text);
```

## Package Details

- **Package Name**: `@meridius-labs/apple-on-device-ai`
- **Scope**: `@meridius-labs` (avoids Apple trademark issues)
- **Platform**: macOS 15.0+ with Apple Silicon only
- **Framework**: Uses Apple's FoundationModels (Apple Intelligence)
