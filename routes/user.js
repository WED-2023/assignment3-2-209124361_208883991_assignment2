var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch(error){
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const favorite_recipes = await recipe_utils.getFavoriteRecipes(user_id);
    res.status(200).send(favorite_recipes);
  } catch(error){
    next(error); 
  }
});

/**
 * This path removes a recipe from the favorites list of the logged-in user
 */
router.delete('/favorites/:recipeId', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipeId;
    await user_utils.removeFromFavorites(user_id, recipe_id);
    res.status(200).send("The Recipe successfully removed from favorites");
  } catch(error){
    next(error);
  }
});

/**
 * Public  – get a user's family recipes (no login required)
 */
router.get('/:userId/family_recipes', async (req, res, next) => {
    try {
        const recipes = await recipe_utils.getFamilyRecipes(req.params.userId);
        if (recipes.length === 0) return res.sendStatus(204);
        res.send(recipes);
    } catch (err) {
        next(err);
    }
});

module.exports = router;