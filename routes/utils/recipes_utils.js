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
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        servings: servings,
        instructions: instructions,
        analyzedInstructions: analyzedInstructions,
        ingredients: extendedIngredients
    }
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
                number: number,
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
            `SELECT completed_steps FROM recipe_progress WHERE user_id = ? AND recipe_id = ?`,
            [user_id, recipe_id]
        );
        return progress[0] || { completedSteps: [] };
    } catch (error) {
        throw error;
    }
}

/**
 * Save recipe progress
 */
async function saveRecipeProgress(user_id, recipe_id, completedSteps) {
    try {
        // First validate that the recipe exists in the API
        try {
            await getRecipeInformation(recipe_id);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw { status: 404, message: "Recipe not found" };
            }
            throw error;
        }

        // If recipe exists, save the progress
        await DButils.execQuery(
            `INSERT INTO recipe_progress (user_id, recipe_id, completed_steps) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE completed_steps = ?`,
            [user_id, recipe_id, JSON.stringify(completedSteps), JSON.stringify(completedSteps)]
        );
    } catch (error) {
        throw error;
    }
}

/**
 * Save last search parameters
 */
async function saveLastSearch(user_id, search_params) {
    try {
        await DButils.execQuery(
            `INSERT INTO last_searches (user_id, query, cuisines, diets, intolerances, limit_num, sort) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                query = VALUES(query),
                cuisines = VALUES(cuisines),
                diets = VALUES(diets),
                intolerances = VALUES(intolerances),
                limit_num = VALUES(limit_num),
                sort = VALUES(sort),
                search_date = CURRENT_TIMESTAMP`,
            [user_id, search_params.query, search_params.cuisines, search_params.diets, 
             search_params.intolerances, search_params.limit, search_params.sort]
        );
    } catch (error) {
        throw error;
    }
}

/**
 * Get last search parameters and fetch fresh results
 */
async function getLastSearch(user_id) {
    try {
        // Get last search parameters
        const lastSearch = await DButils.execQuery(
            `SELECT * FROM last_searches WHERE user_id = ?`,
            [user_id]
        );

        if (!lastSearch || lastSearch.length === 0) {
            return null;
        }

        const searchParams = lastSearch[0];
        
        // Fetch fresh results using the stored parameters
        const results = await searchRecipes(
            searchParams.query,
            searchParams.cuisines,
            searchParams.diets,
            searchParams.intolerances,
            searchParams.limit_num,
            searchParams.sort
        );

        return {
            query: searchParams.query,
            cuisines: searchParams.cuisines,
            diets: searchParams.diets,
            intolerances: searchParams.intolerances,
            limit: searchParams.limit_num,
            sort: searchParams.sort,
            results: results
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Get user's family recipes
 */
async function getFamilyRecipes(user_id) {
    try {
        const recipes = await DButils.execQuery(
            `SELECT * FROM family_recipes WHERE user_id = ?`,
            [user_id]
        );
        return recipes;
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

    // ❷ otherwise forward to Spoonacular
    try {
        const { data } = await axios.get(
            `${api_domain}/${recipe_id}/information`,
            { params: { apiKey: process.env.spooncular_apiKey } }
        );
        return {
            instructions: data.instructions,
            analyzedInstructions: data.analyzedInstructions
        };
    } catch (err) {
        if (err.response && err.response.status === 404)
            throw { status: 404, message: "recipe not found" };
        throw err;
    }
}

/**
 * Create a new recipe
 */
async function createRecipe(recipe_data) {
    try {
        const result = await DButils.execQuery(
            `INSERT INTO family_recipes (user_id, title, created_by, traditional_date, ingredients, instructions, photos) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                recipe_data.user_id,
                recipe_data.title,
                recipe_data.created_by,
                recipe_data.traditional_date,
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
exports.getFamilyRecipes = getFamilyRecipes;
exports.getRecipeInstructions = getRecipeInstructions;
exports.createRecipe = createRecipe;



