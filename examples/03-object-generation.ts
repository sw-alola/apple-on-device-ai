/**
 * Object Generation with AI SDK
 *
 * This example demonstrates structured object generation using the Apple AI provider
 * with the Vercel AI SDK and Zod schemas.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { appleAI as appleAIProvider } from "../src/apple-ai-provider";

// Define schemas for structured data
const recipeSchema = z.object({
  name: z.string().describe("Name of the recipe"),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        amount: z.string(),
        unit: z.string().optional(),
      })
    )
    .describe("List of ingredients with amounts"),
  instructions: z
    .array(z.string())
    .describe("Step-by-step cooking instructions"),
  cookingTime: z.number().describe("Total cooking time in minutes"),
  servings: z.number().describe("Number of servings"),
});

const profileSchema = z.object({
  name: z.string().describe("Person's full name"),
  age: z.number().describe("Person's age"),
  occupation: z.string().describe("Person's job or profession"),
  hobbies: z.array(z.string()).describe("List of hobbies and interests"),
  location: z
    .object({
      city: z.string(),
      country: z.string(),
    })
    .describe("Current location"),
  bio: z.string().describe("Short biographical description"),
});

async function objectGenerationExample() {
  console.log("🧩 Object Generation with AI SDK");
  console.log("=================================");

  try {
    console.log("\n1. Generating a recipe:");
    const { object: recipe } = await generateObject({
      model: appleAIProvider("apple-on-device"),
      schema: recipeSchema,
      prompt: "Generate a recipe for a healthy breakfast smoothie.",
      temperature: 0.7,
    });

    console.log("Generated Recipe:");
    console.log("Name:", recipe.name);
    console.log("Cooking Time:", recipe.cookingTime, "minutes");
    console.log("Servings:", recipe.servings);
    console.log("\nIngredients:");
    recipe.ingredients.forEach((ingredient, i) => {
      console.log(
        `  ${i + 1}. ${ingredient.amount}${
          ingredient.unit ? " " + ingredient.unit : ""
        } ${ingredient.name}`
      );
    });
    console.log("\nInstructions:");
    recipe.instructions.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });

    console.log("\n2. Generating a character profile:");
    const { object: profile } = await generateObject({
      model: appleAIProvider("apple-on-device"),
      schema: profileSchema,
      prompt:
        "Create a character profile for a tech entrepreneur from San Francisco.",
      temperature: 0.8,
    });

    console.log("\nGenerated Profile:");
    console.log("Name:", profile.name);
    console.log("Age:", profile.age);
    console.log("Occupation:", profile.occupation);
    console.log(
      "Location:",
      `${profile.location.city}, ${profile.location.country}`
    );
    console.log("Hobbies:", profile.hobbies.join(", "));
    console.log("Bio:", profile.bio);

    console.log("\n✅ Object generation examples completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the example if this file is executed directly
if (import.meta.main) {
  objectGenerationExample().catch(console.error);
}

export { objectGenerationExample };
