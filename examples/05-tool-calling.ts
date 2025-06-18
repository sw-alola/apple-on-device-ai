import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { appleAI } from "../src/apple-ai-provider.js";

// Define some example tools
const weatherTool = tool({
  description: "Get the current weather for a location",
  parameters: z.object({
    location: z
      .string()
      .describe('The city and country, e.g. "San Francisco, CA"'),
    unit: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .describe("Temperature unit"),
  }),
  execute: async ({ location, unit = "celsius" }) => {
    // Simulate weather API call
    const temp =
      unit === "celsius"
        ? Math.round(Math.random() * 30 + 5)
        : Math.round(Math.random() * 54 + 41);
    const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"][
      Math.floor(Math.random() * 4)
    ];

    return {
      location,
      temperature: temp,
      unit,
      conditions,
      humidity: Math.round(Math.random() * 40 + 30),
      windSpeed: Math.round(Math.random() * 20 + 5),
    };
  },
});

const calculatorTool = tool({
  description: "Perform basic mathematical calculations",
  parameters: z.object({
    operation: z
      .enum(["add", "subtract", "multiply", "divide"])
      .describe("The mathematical operation"),
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
  execute: async ({ operation, a, b }) => {
    let result: number;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) throw new Error("Cannot divide by zero");
        result = a / b;
        break;
    }

    return {
      operation,
      operands: [a, b],
      result,
      expression: `${a} ${
        operation === "add"
          ? "+"
          : operation === "subtract"
          ? "-"
          : operation === "multiply"
          ? "*"
          : "/"
      } ${b} = ${result}`,
    };
  },
});

const timeTool = tool({
  description: "Get the current time in a specific timezone",
  parameters: z.object({
    timezone: z
      .string()
      .describe(
        'Timezone identifier, e.g. "America/New_York", "Europe/London"'
      ),
  }),
  execute: async ({ timezone }) => {
    try {
      const now = new Date();
      const timeString = now.toLocaleString("en-US", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });

      return {
        timezone,
        currentTime: timeString,
        utcTime: now.toISOString(),
      };
    } catch (error) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  },
});

const searchTool = tool({
  description: "Search for information (simulated)",
  parameters: z.object({
    query: z.string().describe("The search query"),
    limit: z
      .number()
      .optional()
      .default(3)
      .describe("Number of results to return"),
  }),
  execute: async ({ query, limit = 3 }) => {
    // Simulate search results
    const results = [
      {
        title: `Understanding ${query}`,
        url: `https://example.com/about-${query
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        snippet: `Comprehensive guide about ${query}...`,
      },
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${query}`,
        snippet: `Wikipedia article covering ${query}...`,
      },
      {
        title: `Latest news about ${query}`,
        url: `https://news.example.com/${query}`,
        snippet: `Recent developments in ${query}...`,
      },
      {
        title: `${query} tutorial`,
        url: `https://tutorial.com/${query}`,
        snippet: `Step-by-step tutorial for ${query}...`,
      },
      {
        title: `${query} best practices`,
        url: `https://bestpractices.com/${query}`,
        snippet: `Industry best practices for ${query}...`,
      },
    ].slice(0, limit);

    return {
      query,
      results,
      totalResults: results.length,
    };
  },
});

async function basicToolCallingExample() {
  console.log("🔧 Basic Tool Calling Example");
  console.log("=".repeat(50));

  const result = await generateText({
    model: appleAI("apple-intelligence"),
    tools: {
      weather: weatherTool,
      calculator: calculatorTool,
    },
    prompt:
      "What's the weather like in Tokyo, Japan? Also, what's 15 multiplied by 7?",
    maxSteps: 3,
  });

  console.log("Final response:", result.text);
  console.log("\nTool calls made:", result.toolCalls.length);

  for (const toolCall of result.toolCalls) {
    console.log(`- ${toolCall.toolName}:`, toolCall.args);
  }

  console.log("\nTool results:");
  for (const toolResult of result.toolResults) {
    console.log(`- ${toolResult.toolName}:`, toolResult.result);
  }
}

async function streamingToolCallsExample() {
  console.log("\n🌊 Streaming Tool Calls Example");
  console.log("=".repeat(50));

  const result = streamText({
    model: appleAI("apple-intelligence"),
    tools: {
      weather: weatherTool,
      time: timeTool,
      search: searchTool,
    },
    prompt:
      'I\'m planning a trip to London. Can you help me get the current weather there, the local time, and search for "London attractions"?',
    maxSteps: 5,
  });

  console.log("Streaming response:");

  // Stream the full response to see all events
  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta":
        process.stdout.write(part.textDelta);
        break;

      case "tool-call":
        console.log(`\n🔧 Tool call: ${part.toolName}`, part.args);
        break;

      case "tool-result":
        console.log(`✅ Tool result: ${part.toolName}`, part.result);
        break;

      case "finish":
        console.log("\n\n🏁 Stream finished");
        console.log("Finish reason:", part.finishReason);
        console.log("Total tokens:", part.usage.totalTokens);
        break;

      case "error":
        console.error("\n❌ Error:", part.error);
        break;
    }
  }
}

async function toolChoiceExample() {
  console.log("\n🎯 Tool Choice Example");
  console.log("=".repeat(50));

  // Force the model to use a specific tool
  console.log("Forcing weather tool usage:");

  const weatherResult = await generateText({
    model: appleAI("apple-intelligence"),
    tools: {
      weather: weatherTool,
      calculator: calculatorTool,
      time: timeTool,
    },
    toolChoice: { type: "tool", toolName: "weather" },
    temperature: 0.1,
    prompt: "Tell me about Paris",
    maxSteps: 2,
  });

  console.log("Response:", weatherResult.text);
  console.log("Tool used:", weatherResult.toolCalls[0]?.toolName);

  // Require any tool to be used
  console.log("\nRequiring any tool usage:");

  const requiredResult = await generateText({
    model: appleAI("apple-intelligence"),
    tools: {
      weather: weatherTool,
      calculator: calculatorTool,
      search: searchTool,
    },
    temperature: 0.1,
    toolChoice: "required",
    prompt: "Help me with something useful",
    maxSteps: 3,
  });

  console.log("Response:", requiredResult.text);
  console.log(
    "Tools used:",
    requiredResult.toolCalls.map((tc) => tc.toolName)
  );
}

async function multiStepWorkflowExample() {
  console.log("\n🔄 Multi-Step Workflow Example");
  console.log("=".repeat(50));

  const result = await generateText({
    model: appleAI("apple-intelligence"),
    tools: {
      weather: weatherTool,
      calculator: calculatorTool,
      time: timeTool,
      search: searchTool,
    },
    temperature: 0.1,
    prompt: `I'm planning a outdoor event in San Francisco next weekend. Can you help me:
    1. Check the weather in San Francisco
    2. Get the current local time there
    3. Calculate how many days until next Saturday (assume today is Monday, so 5 days)
    4. Search for "outdoor event planning tips"
    
    Then give me a summary with recommendations.`,
    maxSteps: 10, // Allow multiple steps for complex workflow
  });

  console.log("Final response:", result.text);
  console.log(`\nWorkflow completed in ${result.steps.length} steps`);

  for (let i = 0; i < result.steps.length; i++) {
    const step = result.steps[i];
    if (step) {
      console.log(`\nStep ${i + 1}:`);
      console.log(
        `- Text: ${step.text?.substring(0, 100)}${
          step.text?.length > 100 ? "..." : ""
        }`
      );
      console.log(`- Tool calls: ${step.toolCalls.length}`);
      console.log(`- Finish reason: ${step.finishReason}`);
    }
  }
}

async function errorHandlingExample() {
  console.log("\n❌ Error Handling Example");
  console.log("=".repeat(50));

  const faultyTool = tool({
    description: "A tool that sometimes fails",
    parameters: z.object({
      shouldFail: z.boolean().describe("Whether this tool should fail"),
    }),
    execute: async ({ shouldFail }) => {
      if (shouldFail) {
        throw new Error("Tool execution failed as requested");
      }
      return { success: true, message: "Tool executed successfully" };
    },
  });

  try {
    const result = await generateText({
      model: appleAI("apple-intelligence"),
      tools: {
        faulty: faultyTool,
        calculator: calculatorTool,
      },
      temperature: 0.1,
      prompt:
        "Test the faulty tool with shouldFail set to true, then calculate 5 + 3",
      maxSteps: 5,
    });

    console.log("Response:", result.text);
    console.log("Tool calls:", result.toolCalls.length);
    console.log("Tool results:", result.toolResults.length);
  } catch (error) {
    console.error(
      "Caught error:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Run all examples
async function runAllExamples() {
  try {
    await basicToolCallingExample();
    await streamingToolCallsExample();
    await toolChoiceExample();
    await multiStepWorkflowExample();
    await errorHandlingExample();

    console.log("\n✅ All tool calling examples completed successfully!");
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
    process.exit(1);
  }
}

// Export for use in other files or run directly
export {
  basicToolCallingExample,
  streamingToolCallsExample,
  toolChoiceExample,
  multiStepWorkflowExample,
  errorHandlingExample,
  runAllExamples,
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
