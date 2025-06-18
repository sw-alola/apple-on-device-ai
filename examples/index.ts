/**
 * Examples Runner
 *
 * Run all examples to test the Apple AI + Vercel AI SDK integration
 */

import { basicGeneration } from "./01-basic-generation";
import { streamingExample } from "./02-streaming";
import { objectGenerationExample } from "./03-object-generation";
import { comprehensiveExample } from "./04-comprehensive";
import { runAllExamples as toolCallingExamples } from "./05-tool-calling";

async function runAllExamples() {
  console.log("🍎 Apple AI + Vercel AI SDK Examples");
  console.log("====================================");
  console.log("Running all examples to test integration...\n");

  const examples = [
    { name: "Basic Generation", fn: basicGeneration },
    { name: "Streaming", fn: streamingExample },
    { name: "Object Generation", fn: objectGenerationExample },
    { name: "Comprehensive", fn: comprehensiveExample },
    { name: "Tool Calling", fn: toolCallingExamples },
  ];

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    if (!example) continue;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running Example ${i + 1}/${examples.length}: ${example.name}`);
    console.log(`${"=".repeat(60)}`);

    try {
      await example.fn();
      console.log(`\n✅ ${example.name} completed successfully!`);
    } catch (error) {
      console.error(`\n❌ ${example.name} failed:`, error);
      console.error("Continuing with next example...");
    }

    // Add a delay between examples
    if (i < examples.length - 1) {
      console.log("\n⏱️  Waiting 2 seconds before next example...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 All examples completed!");
  console.log(`${"=".repeat(60)}`);
}

async function runSingleExample(exampleName?: string) {
  if (!exampleName) {
    return runAllExamples();
  }

  const examples = {
    basic: basicGeneration,
    streaming: streamingExample,
    object: objectGenerationExample,
    comprehensive: comprehensiveExample,
    tools: toolCallingExamples,
  };

  const example = examples[exampleName as keyof typeof examples];
  if (!example) {
    console.error("❌ Unknown example:", exampleName);
    console.log("Available examples:", Object.keys(examples).join(", "));
    return;
  }

  console.log(`🚀 Running ${exampleName} example...`);
  try {
    await example();
    console.log(`\n✅ ${exampleName} example completed!`);
  } catch (error) {
    console.error(`❌ ${exampleName} example failed:`, error);
  }
}

// Run based on command line arguments
const exampleName = process.argv[2];
runSingleExample(exampleName).catch(console.error);
