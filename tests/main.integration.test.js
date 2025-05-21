/**
 * Full-stack integration tests that hit the live Spoonacular API.
 * Requires a valid spoonacular_apiKey in process.env.
 */

const supertest = require('supertest');
jest.setTimeout(20000);

// ────────────────────────────────────────────────────────────
// 1.  Boot the actual server (main.js starts listening as
//     soon as it is required because of the side-effect code)
// ────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';          // helps you guard logs if you like
const { PORT = 3000 } = process.env;    // picked from your .env
require('../main');                     // <-- boots Express on PORT

// supertest will talk to that running instance
const request = supertest(`http://localhost:${PORT}`);

// a generous timeout because Spoonacular can take > 5 s during spikes
jest.setTimeout(20000);

// ────────────────────────────────────────────────────────────
// 2.  Helper: expect "OK" from Spoonacular or skip if quota exhausted
// ────────────────────────────────────────────────────────────
function expectSpoonacularQuota (res) {
  // spoonacular returns 402 or 429 when out of credits
  if (res.status === 402 || res.status === 429) {
    console.warn(
      `Spoonacular quota exhausted (HTTP ${res.status}). ` +
      `Skipping live-API assertions.`
    );
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────
// 3.  Tests
// ────────────────────────────────────────────────────────────
describe('Live main-level routes', () => {

  test('GET /alive responds', async () => {
    const res = await request.get('/alive');
    expect(res.status).toBe(200);
    expect(res.text).toBe("I'm alive");
  });

  test('GET /recipes/random returns at least 1 recipe', async () => {
    const res = await request.get('/recipes/random');
    if (!expectSpoonacularQuota(res)) return;

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
  });

  test('Complex search + detail information round-trip', async () => {
    // 1️⃣  Search
    const searchRes = await request
      .get('/recipes/search')
      .query({ query: 'pasta', number: 1 });
    if (!expectSpoonacularQuota(searchRes)) return;

    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    const { id: recipeId } = searchRes.body[0];
    expect(recipeId).toBeDefined();

    // 2️⃣  Fetch details
    const infoRes = await request.get(`/recipes/${recipeId}`);
    if (!expectSpoonacularQuota(infoRes)) return;

    expect(infoRes.status).toBe(200);
    expect(infoRes.body).toHaveProperty('id', recipeId);
    expect(infoRes.body).toHaveProperty('ingredients');
    expect(infoRes.body).toHaveProperty('instructions');
  });

});

test('GET /recipes/:id returns enriched info', async () => {
    const searchRes = await request
      .get('/recipes/search')
      .query({ query: 'pasta', number: 1 });
  
    expect(searchRes.status).toBe(200);
    const recipeId = searchRes.body[0]?.id;
    expect(recipeId).toBeDefined();
  
    const res = await request.get(`/recipes/${recipeId}`);
    expect(res.status).toBe(200);
  
    console.log("📦 Recipe Info:");
    console.dir(res.body, { depth: null });
  
    expect(res.body).toHaveProperty('instructions');
    expect(Array.isArray(res.body.ingredients)).toBe(true);
  });
  

// ────────────────────────────────────────────────────────────
// 4.  Shutdown server after tests to avoid open handles
// ────────────────────────────────────────────────────────────
afterAll(async () => {
    console.log("Tests done. Shutting down server...");
    
    // Get the server instance from the global scope
    const server = global.server;
    
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log("Server closed successfully");
          resolve();
        });
      });
    }
    
    // Wait a moment to ensure all connections are closed
    await new Promise((resolve) => setTimeout(resolve, 1000));
});
  