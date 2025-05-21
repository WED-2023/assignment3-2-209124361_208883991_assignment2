const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");

async function markAsFavorite(user_id, recipe_id) {
    await DButils.execQuery(
        'INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)',
        [user_id, recipe_id]
    );
}

async function getFavoriteRecipes(user_id) {
    try {
        // Get only recipe IDs from database
        const favorites = await DButils.execQuery(
            'SELECT recipe_id FROM favorites WHERE user_id = ?',
            [user_id]
        );
        
        // Extract recipe IDs into an array
        const recipe_ids = favorites.map(fav => fav.recipe_id);
        
        // Get full recipe details from API
        const recipes_info = await recipes_utils.getRecipesPreview(recipe_ids);
        
        return recipes_info;
    } catch (error) {
        throw error;
    }
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;