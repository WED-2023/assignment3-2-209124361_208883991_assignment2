const request = require('supertest');
const app = require('../main');
const DButils = require('../routes/utils/DButils');

describe('Auth Registration Tests', () => {
    // Clean up the database before each test
    beforeEach(async () => {
        await DButils.execQuery('DELETE FROM users');
    });

    // Test successful registration
    test('should register a new user successfully', async () => {
        const userData = {
            username: 'testuser',
            firstname: 'Test',
            lastname: 'User',
            country: 'Israel',
            password: 'test123@',
            email: 'test@example.com',
            profilePic: 'https://example.com/profile.jpg'
        };

        const response = await request(app)
            .post('/register')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'user created');
        expect(response.body).toHaveProperty('success', true);

        // Verify user was actually created in database
        const users = await DButils.execQuery("SELECT * FROM users WHERE username = 'testuser'");
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe(userData.email);
    });

    // Test duplicate username
    test('should not allow registration with existing username', async () => {
        // First register a user
        const userData = {
            username: 'testuser',
            firstname: 'Test',
            lastname: 'User',
            country: 'Israel',
            password: 'test123@',
            email: 'test@example.com',
            profilePic: 'https://example.com/profile.jpg'
        };

        await request(app)
            .post('/register')
            .send(userData);

        // Try to register another user with same username
        const response = await request(app)
            .post('/register')
            .send(userData);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', 'Username taken');
    });

    // Test registration without profile picture
    test('should register user without profile picture', async () => {
        const userData = {
            username: 'testuser2',
            firstname: 'Test',
            lastname: 'User',
            country: 'Israel',
            password: 'test123@',
            email: 'test2@example.com'
        };

        const response = await request(app)
            .post('/register')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);

        // Verify user was created without profile picture
        const users = await DButils.execQuery("SELECT * FROM users WHERE username = 'testuser2'");
        expect(users).toHaveLength(1);
        expect(users[0].profilePic).toBeNull();
    });

    // Test registration with different profile picture formats
    test('should accept different profile picture URL formats', async () => {
        const testCases = [
            'https://example.com/image.jpg',
            'https://example.com/image.png',
            'https://example.com/image.jpeg',
            'https://example.com/image.gif'
        ];

        for (let i = 0; i < testCases.length; i++) {
            const userData = {
                username: `testuser${i}`,
                firstname: 'Test',
                lastname: 'User',
                country: 'Israel',
                password: 'test123@',
                email: `test${i}@example.com`,
                profilePic: testCases[i]
            };

            const response = await request(app)
                .post('/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);

            // Verify profile picture was saved correctly
            const users = await DButils.execQuery(`SELECT * FROM users WHERE username = 'testuser${i}'`);
            expect(users).toHaveLength(1);
            expect(users[0].profilePic).toBe(testCases[i]);
        }
    });
}); 