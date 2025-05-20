const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");

/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
    }
}

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
                apiKey: process.env.spooncular_apiKey
            }
        });
        return response.data.results;
    } catch (error) {
        throw error;
    }
}

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

async function getRecipeInstructions(recipe_id) {
    try {
        const response = await axios.get(`${api_domain}/${recipe_id}/analyzedInstructions`, {
            params: {
                apiKey: process.env.spooncular_apiKey
            }
        });
        return response.data[0]?.steps || [];
    } catch (error) {
        throw error;
    }
}

async function saveLastSearch(user_id, search_params, results) {
    try {
        await DButils.execQuery(
            `INSERT INTO last_searches (user_id, query, cuisines, diets, intolerances, limit_num, sort, results) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, search_params.query, search_params.cuisines, search_params.diets, 
             search_params.intolerances, search_params.limit, search_params.sort, JSON.stringify(results)]
        );
    } catch (error) {
        throw error;
    }
}

async function getLastSearch(user_id) {
    try {
        const result = await DButils.execQuery(
            `SELECT * FROM last_searches WHERE user_id = ? ORDER BY search_date DESC LIMIT 1`,
            [user_id]
        );
        return result[0];
    } catch (error) {
        throw error;
    }
}

exports.getRecipeDetails = getRecipeDetails;
exports.searchRecipes = searchRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipeInstructions = getRecipeInstructions;
exports.saveLastSearch = saveLastSearch;
exports.getLastSearch = getLastSearch;



