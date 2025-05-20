var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns step-by-step preparation instructions for a recipe
 */
router.get("/:recipeId/instructions", async (req, res, next) => {
  try {
    const instructions = await recipes_utils.getRecipeInstructions(req.params.recipeId);
    res.send(instructions);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the preparation progress for a recipe
 */
router.get("/:userId/recipes/:recipeId/progress", async (req, res, next) => {
  try {
    const progress = await DButils.execQuery(
      `SELECT completed_steps FROM recipe_progress 
       WHERE user_id = ? AND recipe_id = ?`,
      [req.params.userId, req.params.recipeId]
    );
    res.send(progress[0] || { completedSteps: [] });
  } catch (error) {
    next(error);
  }
});

/**
 * This path saves the preparation progress for a recipe
 */
router.post("/:userId/recipes/:recipeId/progress", async (req, res, next) => {
  try {
    const { completedSteps } = req.body;
    await DButils.execQuery(
      `INSERT INTO recipe_progress (user_id, recipe_id, completed_steps) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE completed_steps = ?`,
      [req.params.userId, req.params.recipeId, JSON.stringify(completedSteps), JSON.stringify(completedSteps)]
    );
    res.send({ completedSteps });
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a list of cuisines
 */
router.get("/filters/cuisines", async (req, res, next) => {
  try {
    const cuisines = [
      "African", "American", "British", "Cajun", "Caribbean", "Chinese", 
      "Eastern European", "European", "French", "German", "Greek", "Indian", 
      "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American", 
      "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern", 
      "Spanish", "Thai", "Vietnamese"
    ];
    res.send(cuisines);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a list of diets
 */
router.get("/filters/diets", async (req, res, next) => {
  try {
    const diets = [
      "Gluten Free", "Ketogenic", "Vegetarian", "Lacto-Vegetarian", 
      "Ovo-Vegetarian", "Vegan", "Pescetarian", "Paleo", "Primal", "Whole30"
    ];
    res.send(diets);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a list of intolerances
 */
router.get("/filters/intolerances", async (req, res, next) => {
  try {
    const intolerances = [
      "Dairy", "Egg", "Gluten", "Grain", "Peanut", "Seafood", 
      "Sesame", "Shellfish", "Soy", "Sulfite", "Tree Nut", "Wheat"
    ];
    res.send(intolerances);
  } catch (error) {
    next(error);
  }
});

/**
 * This path searches for recipes based on various criteria
 */
router.get("/search", async (req, res, next) => {
  try {
    const { query, cuisines, diets, intolerances, limit = 10, sort } = req.query;
    const results = await recipes_utils.searchRecipes(
      query, 
      cuisines, 
      diets, 
      intolerances, 
      limit, 
      sort
    );
    
    if (results.length === 0) {
      res.status(204).send();
    } else {
      res.send(results);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the user's last search
 */
router.get("/users/:userId/search/last", async (req, res, next) => {
  try {
    const lastSearch = await recipes_utils.getLastSearch(req.params.userId);
    if (!lastSearch) {
      res.status(204).send();
    } else {
      res.send({
        query: lastSearch.query,
        cuisines: lastSearch.cuisines,
        diets: lastSearch.diets,
        intolerances: lastSearch.intolerances,
        limit: lastSearch.limit_num,
        sort: lastSearch.sort,
        results: JSON.parse(lastSearch.results)
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
