const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");

/**
 * Get recipe information from Spoonacular API
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

/**
 * Get detailed information about a recipe
 */
async function getRecipeDetails(recipe_id) {
    // Try to find in family_recipes
    const familyRows = await DButils.execQuery(
        "SELECT * FROM family_recipes WHERE recipe_id = ?",
        [recipe_id]
    );
    if (familyRows.length) {
        const r = familyRows[0];
        return {
            id: r.recipe_id,
            title: r.title,
            created_by: r.created_by,
            traditional_date: r.traditional_date,
            ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
            instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : r.instructions,
            photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos
        };
    }

    // Try to find in user_recipes
    const userRows = await DButils.execQuery(
        "SELECT * FROM user_recipes WHERE recipe_id = ?",
        [recipe_id]
    );
    if (userRows.length) {
        const r = userRows[0];
        return {
            id: r.recipe_id,
            title: r.title,
            description: r.description,
            ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients,
            instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : r.instructions,
            photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos
        };
    }

    // Otherwise, call Spoonacular
    let recipe_info = await getRecipeInformation(recipe_id);
    let { 
        id, 
        title, 
        readyInMinutes, 
        image, 
        aggregateLikes, 
        vegan, 
        vegetarian, 
        glutenFree,
        servings,
        instructions,
        analyzedInstructions,
        extendedIngredients
    } = recipe_info.data;

    return {
        id,
        title,
        readyInMinutes,
        image,
        aggregateLikes,
        vegan,
        vegetarian,
        glutenFree,
        servings,
        instructions,
        analyzedInstructions,
        ingredients: extendedIngredients
    };
}

/**
 * Search for recipes with various filters
 */
async function searchRecipes(query, cuisine, diet, intolerances, number, sort) {
    try {
        const response = await axios.get(`${api_domain}/complexSearch`, {
            params: {
                query: query,
                cuisine: cuisine,
                diet: diet,
                intolerances: intolerances,
                number: number || 5, // Default to 5 if not specified
                sort: sort,
                addRecipeInformation: true,
                instructionsRequired: true,
                fillIngredients: true,
                apiKey: process.env.spooncular_apiKey
            }
        });
        return response.data.results;
    } catch (error) {
        throw error;
    }
}

/**
 * Get random recipes
 */
async function getRandomRecipes(number = 5, tags = "") {
    try {
        const response = await axios.get(`${api_domain}/random`, {
            params: {
                number: number,
                tags: tags,
                apiKey: process.env.spooncular_apiKey
            }
        });
        return response.data.recipes;
    } catch (error) {
        throw error;
    }
}

/**
 * Get preview information for multiple recipes
 */
async function getRecipesPreview(recipes_id_array) {
    let recipes_info = [];
    for (let recipe_id of recipes_id_array) {
        try {
            const recipe_info = await getRecipeDetails(recipe_id);
            recipes_info.push(recipe_info);
        } catch (error) {
            console.log("Error getting recipe details:", error);
        }
    }
    return recipes_info;
}

/**
 * Get user's favorite recipes with full details from API
 */
async function getFavoriteRecipes(user_id) {
    try {
        // Get only recipe IDs from database
        const favorites = await DButils.execQuery(
            `SELECT recipe_id FROM favorites WHERE user_id = ?`,
            [user_id]
        );
        
        // Extract recipe IDs into an array
        const recipe_ids = favorites.map(fav => fav.recipe_id);
        
        // Get full recipe details from API
        const recipes_info = await getRecipesPreview(recipe_ids);
        
        return recipes_info;
    } catch (error) {
        throw error;
    }
}

/**
 * Mark recipe as favorite
 */
async function markAsFavorite(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)`,
            [user_id, recipe_id]
        );
    } catch (error) {
        throw error;
    }
}

/**
 * Get recipe progress
 */
async function getRecipeProgress(user_id, recipe_id) {
    try {
        const progress = await DButils.execQuery(
            `SELECT last_step FROM recipe_progress WHERE user_id = ? AND recipe_id = ?`,
            [user_id, recipe_id]
        );
        return progress[0] || { last_step: 0 };
    } catch (error) {
        throw error;
    }
}

/**
 * Save recipe progress
 */
async function saveRecipeProgress(user_id, recipe_id, step_number) {
    try {

        // If recipe exists, save the progress
        await DButils.execQuery(
            `INSERT INTO recipe_progress (user_id, recipe_id, last_step) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE last_step = ?`,
            [user_id, recipe_id, step_number, step_number]
        );
    } catch (error) {
        throw error;
    }
}

/**
 * Save recipe to user history
 */
async function saveLastSearch(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `INSERT INTO user_history (user_id, recipe_id) VALUES (?, ?)`,
            [user_id, recipe_id]
        );
    } catch (error) {
        throw error;
    }
}

/**
 * Get last 3 recipes from user history
 */
async function getLastSearch(user_id) {
    try {
        const lastRecipes = await DButils.execQuery(
            `SELECT recipe_id FROM user_history 
             WHERE user_id = ? 
             ORDER BY timestamp DESC 
             LIMIT 3`,
            [user_id]
        );

        if (!lastRecipes || lastRecipes.length === 0) {
            return null;
        }

        // Get full recipe details from API
        const recipe_ids = lastRecipes.map(recipe => recipe.recipe_id);
        const recipes_info = await getRecipesPreview(recipe_ids);
        
        return recipes_info;
    } catch (error) {
        throw error;
    }
}

/**
 * Get recipe instructions
 */
async function getRecipeInstructions(recipe_id) {
    // ❶ first check local DB (family_recipes)
    const rows = await DButils.execQuery(
        "SELECT instructions, analyzedInstructions FROM family_recipes WHERE recipe_id = ?",
        [recipe_id]
    );
    if (rows.length) {
        return {
            instructions: rows[0].instructions,
            analyzedInstructions: rows[0].analyzedInstructions || []
        };
    }

    // ❷ do NOT forward to Spoonacular for family recipes
    throw { status: 404, message: "recipe not found in family_recipes" };
}

/**
 * Create a new user recipe
 */
async function createUserRecipe(recipe_data) {
    try {
        const result = await DButils.execQuery(
            `INSERT INTO user_recipes (user_id, title, description, ingredients, instructions, photos) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                recipe_data.user_id,
                recipe_data.title,
                recipe_data.description,
                JSON.stringify(recipe_data.ingredients),
                JSON.stringify(recipe_data.instructions),
                JSON.stringify(recipe_data.photos || [])
            ]
        );
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

/**
 * Get user's created recipes
 */
async function getUserRecipes(user_id) {
    try {
        const recipes = await DButils.execQuery(
            `SELECT * FROM user_recipes WHERE user_id = ? ORDER BY created_at DESC`,
            [user_id]
        );
        return recipes;
    } catch (error) {
        throw error;
    }
}

/**
 * Check if a recipe has been viewed by a user
 */
async function hasViewedRecipe(user_id, recipe_id) {
    try {
        const result = await DButils.execQuery(
            `SELECT COUNT(*) as count FROM user_history 
             WHERE user_id = ? AND recipe_id = ?`,
            [user_id, recipe_id]
        );
        return result[0].count > 0;
    } catch (error) {
        throw error;
    }
}

/**
 * Get all family recipes (for all users)
 */
async function getAllFamilyRecipes() {
    try {
        const recipes = await DButils.execQuery(
            `SELECT * FROM family_recipes`
        );
        return recipes;
    } catch (error) {
        throw error;
    }
}

exports.getRecipeDetails = getRecipeDetails;
exports.searchRecipes = searchRecipes;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsFavorite = markAsFavorite;
exports.getRecipeProgress = getRecipeProgress;
exports.saveRecipeProgress = saveRecipeProgress;
exports.saveLastSearch = saveLastSearch;
exports.getLastSearch = getLastSearch;
exports.getRecipeInstructions = getRecipeInstructions;
exports.createUserRecipe = createUserRecipe;
exports.getUserRecipes = getUserRecipes;
exports.hasViewedRecipe = hasViewedRecipe;
exports.getAllFamilyRecipes = getAllFamilyRecipes;