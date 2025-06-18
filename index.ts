import { appleAI } from "./src/apple-ai.js";

async function main() {
  console.log("🍎 Apple AI - On-Device Foundation Models");
  console.log("==========================================");

  try {
    // Check if Apple Intelligence is available
    const availability = await appleAI.checkAvailability();
    console.log("Availability:", availability);

    if (!availability.available) {
      console.log("Apple Intelligence not available:", availability.reason);
      return;
    }

    // Get supported languages
    console.log("Supported languages:", appleAI.getSupportedLanguages());

    // Example messages for chat
    const messages = [
      { role: "system" as const, content: "You are a helpful assistant." },
      { role: "user" as const, content: "What is the capital of France?" },
    ];

    console.log("\n📝 Non-streaming Chat Completion:");
    console.log("=================================");

    // Non-streaming completion (default behavior)
    const completion = await appleAI.createChatCompletion({
      messages,
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log("Response:", completion.choices[0]?.message.content);
    console.log("Model:", completion.model);
    console.log("ID:", completion.id);

    console.log("\n🌊 Streaming Chat Completion:");
    console.log("==============================");

    // Streaming completion
    const stream = appleAI.createChatCompletion({
      messages,
      temperature: 0.7,
      max_tokens: 100,
      stream: true, // Enable streaming
    });

    console.log("Streaming response:");
    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }

      // Check if streaming is done
      if (chunk.choices[0]?.finish_reason === "stop") {
        console.log("\n\nStreaming completed!");
        console.log("Full response:", fullResponse);
        break;
      }
    }

    console.log("\n✅ Both streaming and non-streaming work!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
