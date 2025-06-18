import { appleAISDK } from "../src/apple-ai";

/**
 * Minimal structured generation example using the new JSON-Schema bridge.
 *
 * Usage:
 *   bun run examples/06-structured-basic.ts
 */
async function main() {
  console.log(
    "🔬 Structured Generation – minimal example\n=============================="
  );

  // Very small JSON-Schema describing a person object
  const schemaJson = JSON.stringify({
    title: "Person",
    type: "object",
    properties: {
      name: { type: "string", description: "The person's name" },
      age: { type: "integer", description: "The person's age" },
    },
    required: ["name", "age"],
  });

  try {
    const { text } = await appleAISDK.generateStructured({
      prompt: "Generate a random person.",
      schemaJson,
      temperature: 0.7,
      maxTokens: 100,
    });

    console.log("\nGenerated text representation:\n", text);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as structuredBasicExample };
