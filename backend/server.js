// 1. Import necessary libraries
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// 2. Configure dotenv
dotenv.config();

// 3. Initialize Express app
const app = express();
const port = process.env.PORT || 5001;

// 4. Configure Middleware
app.use(cors());
app.use(express.json());

// --- 5. Initialize Google Gemini Client ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined in .env file.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // 
console.log("Google Gemini AI client initialized.");

// --- 6. Define API Endpoint for Recipe Generation ---
app.post('/api/generate-recipe', async (req, res) => {
    console.log("Received request at /api/generate-recipe");
    console.log("Request body:", req.body);

    try {
        const { ingredients, prepTime, servings,  recipeType } = req.body;

        if (!ingredients || !prepTime || !servings || !recipeType) {
            console.error("Validation Error: Missing required fields.");
            return res.status(400).json({ error: 'Please provide ingredients, prep time, servings, and recipe type.' });
        }

         // --- Modify Prompt Construction ---
         let dietConstraint = ""; 

         if (recipeType === 'veg') {
             dietConstraint = `The recipe MUST be strictly vegetarian. Do not include any meat, poultry, or fish. Eggs and dairy are not acceptable in any condition in the 'Available Ingredients' . Assume basic vegetable oil, salt, pepper, water.`;}
else { 
    dietConstraint = `The user is open to non-vegetarian options. If it makes sense with the 'Available Ingredients' (\`${ingredients}\`), you MAY suggest incorporating common non-vegetarian items like chicken breast or eggs, even if not explicitly listed. However, the primary focus should remain on the provided ingredients. Do not suggest red meat or fish unless they are listed. Assume basic oil, salt, pepper, water.`;
}


    // Use the detailed prompt you refined earlier
        const prompt = `
// Revised Prompt for Gemini AI

const prompt = 
**ROLE:** You are "Chef-AI", an expert culinary assistant specializing in creating innovative and delicious recipes from limited ingredients. Your expertise lies in maximizing flavor, ensuring practicality, and providing clear, actionable instructions.

**TASK:** Generate ONE complete recipe based *strictly* on the user-provided constraints below. The output MUST be a single, valid JSON object conforming precisely to the specified format, with no additional text, commentary, or formatting whatsoever.

**USER CONSTRAINTS:**

1.  **Available Ingredients:** \`${ingredients}\`
    *   These are the primary ingredients available. Prioritize their use creatively.
    *   You MAY assume the user has basic kitchen staples: salt, black pepper, cooking oil (like vegetable or olive oil), and water. Do NOT assume other staples unless explicitly listed in the available ingredients.
    *   Do NOT introduce significant new ingredients beyond the staples unless absolutely essential for the dish's core structure and it's highly plausible a user would have it (e.g., maybe flour if making a simple sauce, but not exotic spices). If you add a minor staple, list it in the ingredients.

2.  **Desired Preparation Time Category:** \`${prepTime}\`
    *   This indicates the user's preference:
        *   'quick': Aim for under 30 minutes total time (prep + cook).
        *   'medium': Aim for 30 to 60 minutes total time.
        *   'long': Can exceed 60 minutes total time.
    *   Your generated \`prepTimeActual\` field in the JSON should reflect a realistic estimate within the target category.

3.  **Number of Servings:** \`${servings}\`
    *   The recipe MUST be scaled for this exact number of people.
    *   All quantities listed in the \`ingredientsList\` of the JSON output must be adjusted accordingly for \`${servings}\` servings.

**RECIPE GENERATION GUIDELINES:**

*   **Creativity & Cohesion:** Invent a specific, appealing dish name (\`title\`). Design a recipe that logically combines the available ingredients into a cohesive and flavorful meal. Think about flavor profiles (savory, sweet, spicy, umami) and textures.
*   **Ingredient Usage:** Use the provided ingredients effectively. Don't feel obligated to use *every single* listed ingredient if it doesn't make sense for the dish, but prioritize using the main items.
*   **Instruction Clarity:** Write the \`instructions\` as a numbered list of clear, concise, actionable steps. Start steps with verbs (e.g., "Chop the onions," "Sauté the chicken," "Preheat the oven"). Include specific quantities, temperatures (Celsius and Fahrenheit if applicable, e.g., "180°C / 350°F"), and cooking times where necessary. Ensure the steps flow logically from preparation to plating.
*   **Description:** The \`description\` should be a brief (1-2 sentences), enticing summary of the final dish, highlighting its key characteristics or flavors.
*   **Nutrition Estimation:** Provide *plausible, estimated* nutritional values (\`calories\`, \`protein\`, \`carbs\`, \`fat\`) *per serving*. Use standard units (kcal for calories, g for others). Preface values with "Approx." as shown in the format.
${dietConstraint} 

**MANDATORY OUTPUT FORMAT:**

*   **OUTPUT MUST BE JSON ONLY.**
*   **DO NOT** include any introductory text like "Here is your recipe:", "Sure, I can help with that:", or any explanations outside the JSON structure.
*   **DO NOT** include markdown formatting like \`\`\`json or \`\`\`.
*   The output must start *exactly* with \`{\` and end *exactly* with \`}\`.
*   Adhere strictly to the following JSON structure and field names:

\`\`\`json
{
  "title": "Specific and Appealing Recipe Title",
  "description": "A short, enticing description highlighting key flavors or characteristics.",
  "prepTimeActual": "Realistic estimated total time (prep + cook), e.g., 'Approx. 40 minutes'",
  "servingsActual": ${servings}, // Must match the user's requested number
  "ingredientsList": [
    // List ALL ingredients used, including assumed staples, with quantities scaled for servingsActual
    {"item": "Ingredient Name", "quantity": "Precise Amount (e.g., '1 large', '250g', '1/2 cup', '1 tbsp')"}
    // ... more ingredients
  ],
  "instructions": [
    // Clear, numbered, actionable steps from start to finish
    "Step 1: Detailed action...",
    "Step 2: Detailed action with temp/time if needed...",
    "Step 3: ..."
    // ... more steps
  ],
  "nutrition": {
    // Plausible estimates per single serving
    "calories": "Approx. XXX kcal per serving",
    "protein": "Approx. XX g per serving",
    "carbs": "Approx. XX g per serving",
    "fat": "Approx. XX g per serving"
  }
}
\`\`\`

**FINAL CHECK:** Review your generated output. Is it valid JSON? Does it contain ONLY the JSON object? Does it meet all the constraints and guidelines? Generate the recipe now.`;
        // console.log("--- PROMPT START ---\n", prompt, "\n--- PROMPT END ---");
        console.log("Sending prompt to Gemini AI...");

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Received response from Gemini AI.");
        
        let recipeJson;
        try {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error("Could not find JSON object in the AI response.");
            }
            const jsonString = text.substring(jsonStart, jsonEnd);
            recipeJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);
            console.error("Raw response that failed parsing:", text);
            return res.status(500).json({
                error: 'Failed to parse recipe from AI response.',
                rawResponse: text
            });
        }

        console.log("Successfully parsed recipe. Sending to frontend.");
        res.status(200).json(recipeJson);

    } catch (error) {
        console.error("Error during recipe generation process:", error);
        res.status(500).json({ error: 'Failed to generate recipe due to an internal server error.', details: error.message });
    }
});

// --- 7. Start the Server ---
app.listen(port, () => {
    console.log(`✅ Backend server is running and listening on http://localhost:${port}`);
    console.log("Endpoint available: /api/generate-recipe"); // Updated log
});
