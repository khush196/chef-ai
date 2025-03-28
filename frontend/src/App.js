// frontend/src/App.js - Simplified (No Image Generation)

import React, { useState } from 'react'; // Removed useEffect if not needed elsewhere
import './App.css';

function App() {
    // --- State Variables ---
    const [ingredients, setIngredients] = useState('');
    const [prepTime, setPrepTime] = useState('medium');
    const [servings, setServings] = useState(2);
    const [recipe, setRecipe] = useState(null);
    // Use simpler names now
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recipeType, setRecipeType] = useState('veg'); // Add this line, default to 'veg'


  

    // --- Event Handlers ---
    const handleIngredientsChange = (event) => {
        setIngredients(event.target.value);
    };
    const handlePrepTimeChange = (event) => {
        setPrepTime(event.target.value);
    };
    const handleServingsChange = (event) => {
        const value = Math.max(1, parseInt(event.target.value, 10) || 1);
        setServings(value);
    };

    // --- Form Submission Handler ---
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Reset states
        setRecipe(null);
        setError(null);
        
        setIsLoading(true); // Start loading

        const requestData = { ingredients, prepTime, servings,  recipeType: recipeType  };

        try {
            const response = await fetch('http://localhost:5001/api/generate-recipe', { // Ensure backend URL is correct
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const recipeData = await response.json();
            setRecipe(recipeData); // Store the received recipe

            // REMOVED: Call to generateImage

        } catch (err) {
            console.error("Error fetching recipe:", err);
            setError(err.message || 'An unexpected error occurred fetching the recipe.');
        } finally {
            setIsLoading(false); // Stop loading
        }
    };


    // --- JSX Structure to Render ---
    return (
        <div className="App">
            <header className="app-header">
                <h1>Chef-AI 🤖🍳</h1>
                <p>Generate amazing recipes from the ingredients you have!</p>
            </header>

            {/* Recipe Input Form */}
            <form onSubmit={handleSubmit} className="recipe-form">

             {/* --- NEW: Recipe Type Buttons --- */}
            <div className="form-group">
                <label>Recipe Type:</label> {/* Optional label */}
                <div className="type-buttons-container">
                    <button
                        type="button" // Important: Prevents form submission
                        className={`type-button ${recipeType === 'veg' ? 'active' : ''}`}
                        onClick={() => setRecipeType('veg')} // Update state on click
                    >
                        🥕 Veg
                    </button>
                    <button
                        type="button" // Important: Prevents form submission
                        className={`type-button ${recipeType === 'non-veg' ? 'active' : ''}`}
                        onClick={() => setRecipeType('non-veg')} // Update state on click
                    >
                        🍗 Non-Veg
                    </button>
                </div>
            </div>
            {/* --- END NEW --- */}

                {/* Ingredients Input */}
                <div className="form-group">
                    <label htmlFor="ingredients">Ingredients:</label>
                    <textarea
                        id="ingredients"
                        value={ingredients}
                        onChange={handleIngredientsChange}
                        placeholder="Enter ingredients..."
                        required
                    />
                </div>
                {/* Prep Time Selection */}
                <div className="form-group">
                    <label htmlFor="prepTime">Preferred Prep Time:</label>
                    <select id="prepTime" value={prepTime} onChange={handlePrepTimeChange}>
                        <option value="quick">Quick (Under 30 mins)</option>
                        <option value="medium">Medium (30-60 mins)</option>
                        <option value="long">Long (Over 60 mins)</option>
                    </select>
                </div>
                {/* Servings Input */}
                <div className="form-group">
                    <label htmlFor="servings">Number of Servings:</label>
                    <input
                        id="servings"
                        type="number"
                        value={servings}
                        onChange={handleServingsChange}
                        min="1"
                        required
                    />
                </div>
                {/* Submit Button - Simplified */}
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Generating Recipe...' : 'Generate Recipe'}
                </button>
            </form>

            {/* --- Display Area --- */}

            {/* Loading Indicator */}
            {isLoading && <p className="loading-message">🧠 AI is crafting your recipe...</p>}

            {/* Error Message Display */}
            {error && <p className="error-message">⚠️ Error: {error}</p>}

            {/* REMOVED: Image Display Section */}

            {/* Recipe Display (only show if recipe exists and no error) */}
            {recipe && !error && (
                <div className="recipe-display">
                    <h2>{recipe.title || 'Your Generated Recipe'}</h2>
                    <p>{recipe.description || 'Enjoy your custom-made dish!'}</p>
                    <p><strong>Prep Time:</strong> {recipe.prepTimeActual || 'N/A'} | <strong>Servings:</strong> {recipe.servingsActual || 'N/A'}</p>

                    {/* Ingredients List */}
                    {recipe.ingredientsList && recipe.ingredientsList.length > 0 && (
                        <>
                            <h3>Ingredients:</h3>
                            <ul>
                                {recipe.ingredientsList.map((ingredient, index) => (
                                    <li key={index} className="ingredient-item">
                                        <strong>{ingredient.item}:</strong> {ingredient.quantity}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {/* Instructions List */}
                    {recipe.instructions && recipe.instructions.length > 0 && (
                        <>
                            <h3>Instructions:</h3>
                            <ol>
                                {recipe.instructions.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ol>
                        </>
                    )}
                    {/* Nutrition Information */}
                    {recipe.nutrition && (
                        <div className="nutrition-info">
                            <h3>Nutrition (Approx. per serving):</h3>
                            <p><strong>Calories:</strong> {recipe.nutrition.calories || 'N/A'}</p>
                            <p><strong>Protein:</strong> {recipe.nutrition.protein || 'N/A'}</p>
                            <p><strong>Carbohydrates:</strong> {recipe.nutrition.carbs || 'N/A'}</p>
                            <p><strong>Fat:</strong> {recipe.nutrition.fat || 'N/A'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;