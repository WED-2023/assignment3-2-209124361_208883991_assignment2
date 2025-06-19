const express = require('express');
const router = express.Router();
// const auth = require('./middleware/auth'); // Uncomment and adjust path if you have auth middleware
const DButils = require('./utils/DButils');
const recipes_utils = require('./utils/recipes_utils');

// POST /userRecipes - Create a new user recipe
router.post('/', /*auth,*/ async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: 'unauthorized' });
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
      return res.status(400).send({ message: 'invalid recipe data' });
    }

    // If validation passes, create the recipe
    const recipe_id = await recipes_utils.createUserRecipe(recipe_data);
    res.status(201).send({ recipe_id });
  } catch (error) {
    next(error);
  }
});

// GET /userRecipes - Get all recipes created by the logged-in user
router.get('/', /*auth,*/ async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: 'unauthorized' });
    }
    const recipes = await recipes_utils.getUserRecipes(req.session.user_id);
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