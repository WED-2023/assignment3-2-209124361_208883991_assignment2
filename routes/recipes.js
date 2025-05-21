var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

/**
 * This path returns random recipes
 */
router.get("/random", async (req, res, next) => {
  try {
    const { number = 5, tags = "" } = req.query;
    const recipes = await recipes_utils.getRandomRecipes(number, tags);
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path searches for recipes based on various criteria
 */
router.get("/search", async (req, res, next) => {
  try {
    const { query, cuisines, diets, intolerances, limit = 5, sort } = req.query;
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
 * This path returns the preparation progress for a recipe
 */
router.get("/:userId/recipes/:recipeId/progress", async (req, res, next) => {
  try {
    const progress = await recipes_utils.getRecipeProgress(req.params.userId, req.params.recipeId);
    res.send(progress);
  } catch (error) {
    next(error);
  }
});

/**
 * This path saves the preparation progress for a recipe
 */
router.post("/:userId/recipes/:recipeId/progress", async (req, res, next) => {
  try {
    const { step_number } = req.body;
    if (step_number === undefined) {
      return res.status(400).send({ message: "step_number is required" });
    }
    await recipes_utils.saveRecipeProgress(req.params.userId, req.params.recipeId, step_number);
    res.send({ last_step: step_number });
  } catch (error) {
    next(error);
  }
});

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
 * This path records a recipe view in user history
 */
router.post("/:recipeId/view", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "unauthorized" });
    }
    
    await recipes_utils.saveLastSearch(req.session.user_id, req.params.recipeId);
    res.status(200).send({ message: "Recipe view recorded" });
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the user's last 3 viewed recipes
 */
router.get("/:userId/search/last", async (req, res, next) => {
  try {
    const lastRecipes = await recipes_utils.getLastSearch(req.params.userId);
    if (!lastRecipes) {
      res.status(204).send();
    } else {
      res.send(lastRecipes);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a user's family recipes
 */
router.get("/users/:userId/family_recipes", async (req, res, next) => {
    try {
        const recipes = await recipes_utils.getFamilyRecipes(req.params.userId);
        if (recipes.length === 0) {
            res.status(204).send();
        } else {
            res.send(recipes);
        }
    } catch (error) {
        next(error);
    }
});

/**
 * This path returns a recipe's instructions
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
 * This path creates a new recipe
 */
router.post("/", async (req, res, next) => {
    try {
        // Check for session first
        if (!req.session || !req.session.user_id) {
            return res.status(401).send({ message: "unauthorized" });
        }

        const recipe_data = {
            user_id: req.session.user_id,
            title: req.body.title,
            created_by: req.body.created_by,
            traditional_date: req.body.traditional_date,
            ingredients: req.body.ingredients,
            instructions: req.body.instructions,
            photos: req.body.photos
        };

        // Validate required fields and data types
        if (
            !recipe_data.title ||
            !Array.isArray(recipe_data.ingredients) ||
            !Array.isArray(recipe_data.instructions) ||
            recipe_data.ingredients.length === 0 ||
            recipe_data.instructions.length === 0
        ) {
            return res.status(400).send({ message: "invalid recipe data" });
        }

        // If validation passes, create the recipe
        const recipe_id = await recipes_utils.createRecipe(recipe_data);
        res.status(201).send({ recipe_id });
    } catch (error) {
        next(error);
    }
});

/**
 * This path creates a new user recipe
 */
router.post("/user-recipes", async (req, res, next) => {
    try {
        // Check for session first
        if (!req.session || !req.session.user_id) {
            return res.status(401).send({ message: "unauthorized" });
        }

        const recipe_data = {
            user_id: req.session.user_id,
            title: req.body.title,
            description: req.body.description,
            ingredients: req.body.ingredients,
            instructions: req.body.instructions,
            photos: req.body.photos
        };

        // Validate required fields and data types
        if (
            !recipe_data.title ||
            !Array.isArray(recipe_data.ingredients) ||
            !Array.isArray(recipe_data.instructions) ||
            recipe_data.ingredients.length === 0 ||
            recipe_data.instructions.length === 0
        ) {
            return res.status(400).send({ message: "invalid recipe data" });
        }

        // If validation passes, create the recipe
        const recipe_id = await recipes_utils.createUserRecipe(recipe_data);
        res.status(201).send({ recipe_id });
    } catch (error) {
        next(error);
    }
});

/**
 * This path returns a user's created recipes
 */
router.get("/users/:userId/recipes", async (req, res, next) => {
    try {
        const recipes = await recipes_utils.getUserRecipes(req.params.userId);
        if (recipes.length === 0) {
            res.status(204).send();
        } else {
            res.send(recipes);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;