// const request = require('supertest');
// const app = require('../test-server');
// const DButils = require('../routes/utils/DButils');

// describe('Recipe API Tests', () => {
//     let testUserId;
//     let testRecipeId;
//     let testSession;

//     // Setup before all tests
//     beforeAll(async () => {
//         // Create a test user
//         const userResult = await DButils.execQuery(
//             `INSERT INTO users (username, firstname, lastname, country, password, email) 
//              VALUES (?, ?, ?, ?, ?, ?)`,
//             ['testuser_recipe', 'Test', 'User', 'Israel', 'test123@', 'test_recipe@example.com']
//         );
//         testUserId = userResult.insertId;

//         // Create a test session
//         testSession = {
//             user_id: testUserId
//         };
//     });

//     // Clean up after all tests
//     afterAll(async () => {
//         await DButils.execQuery('DELETE FROM family_recipes WHERE user_id = ?', [testUserId]);
//         await DButils.execQuery('DELETE FROM users WHERE user_id = ?', [testUserId]);
//     });

//     // Test creating a new recipe
//     describe('POST /recipes', () => {
//         test('should create a new recipe successfully', async () => {
//             const recipeData = {
//                 title: 'Test Recipe',
//                 created_by: 'Test User',
//                 traditional_date: '2024-03-20',
//                 ingredients: ['ingredient1', 'ingredient2'],
//                 instructions: ['step1', 'step2'],
//                 photos: ['photo1.jpg', 'photo2.jpg']
//             };

//             const response = await request(app)
//                 .post('/recipes')
//                 .set('Cookie', [`session=${JSON.stringify(testSession)}`])
//                 .send(recipeData);

//             expect(response.status).toBe(201);
//             expect(response.body).toHaveProperty('recipe_id');
//             testRecipeId = response.body.recipe_id;

//             // Verify recipe was actually created in database
//             const recipes = await DButils.execQuery(
//                 'SELECT * FROM family_recipes WHERE recipe_id = ?',
//                 [testRecipeId]
//             );
//             expect(recipes).toHaveLength(1);
//             expect(recipes[0].title).toBe(recipeData.title);
//         });

//         test('should return 401 when not authenticated', async () => {
//             const recipeData = {
//                 title: 'Test Recipe',
//                 created_by: 'Test User',
//                 traditional_date: '2024-03-20',
//                 ingredients: ['ingredient1'],
//                 instructions: ['step1']
//             };

//             const response = await request(app)
//                 .post('/recipes')
//                 .send(recipeData);

//             expect(response.status).toBe(401);
//         });
//     });

//     // Test getting family recipes
//     describe('GET /users/:userId/family_recipes', () => {
//         test('should return user\'s family recipes', async () => {
//             const response = await request(app)
//                 .get(`/users/${testUserId}/family_recipes`);

//             expect(response.status).toBe(200);
//             expect(Array.isArray(response.body)).toBe(true);
//             expect(response.body.length).toBeGreaterThan(0);
//             expect(response.body[0]).toHaveProperty('title', 'Test Recipe');
//         });

//         test('should return 204 when user has no recipes', async () => {
//             // Create a new user with no recipes
//             const newUserResult = await DButils.execQuery(
//                 `INSERT INTO users (username, firstname, lastname, country, password, email) 
//                  VALUES (?, ?, ?, ?, ?, ?)`,
//                 ['newuser_recipe', 'New', 'User', 'Israel', 'test123@', 'new_recipe@example.com']
//             );
//             const newUserId = newUserResult.insertId;

//             const response = await request(app)
//                 .get(`/users/${newUserId}/family_recipes`);

//             expect(response.status).toBe(204);

//             // Clean up
//             await DButils.execQuery('DELETE FROM users WHERE user_id = ?', [newUserId]);
//         });
//     });

//     // Test getting recipe instructions
//     describe('GET /recipes/:recipeId/instructions', () => {
//         test('should return recipe instructions', async () => {
//             const response = await request(app)
//                 .get(`/recipes/${testRecipeId}/instructions`);

//             expect(response.status).toBe(200);
//             expect(response.body).toHaveProperty('instructions');
//             expect(response.body).toHaveProperty('analyzedInstructions');
//         });

//         test('should return 404 for non-existent recipe', async () => {
//             const response = await request(app)
//                 .get('/recipes/999999/instructions');

//             expect(response.status).toBe(404);
//         });
//     });

//     // Test recipe creation validation
//     describe('Recipe Creation Validation', () => {
//         test('should validate required fields', async () => {
//             const invalidRecipeData = {
//                 title: 'Test Recipe'
//                 // Missing required fields
//             };

//             const response = await request(app)
//                 .post('/recipes')
//                 .set('Cookie', [`session=${JSON.stringify(testSession)}`])
//                 .send(invalidRecipeData);

//             expect(response.status).toBe(400);
//         });

//         test('should validate ingredients and instructions arrays', async () => {
//             const invalidRecipeData = {
//                 title: 'Test Recipe',
//                 created_by: 'Test User',
//                 traditional_date: '2024-03-20',
//                 ingredients: 'not an array', // Should be an array
//                 instructions: 'not an array' // Should be an array
//             };

//             const response = await request(app)
//                 .post('/recipes')
//                 .set('Cookie', [`session=${JSON.stringify(testSession)}`])
//                 .send(invalidRecipeData);

//             expect(response.status).toBe(400);
//         });
//     });
// }); 