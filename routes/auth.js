const express = require("express");
const router = express.Router();
const DButils = require("./utils/DButils");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res, next) => {
    try {
        const { username, firstname, lastname, country, password, email, profilePic } = req.body;
        
        // Check if username exists
        const users = await DButils.execQuery(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );
        
        if (users.length > 0) {
            return res.status(409).send({ message: "Username taken" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        await DButils.execQuery(
            `INSERT INTO users (username, firstname, lastname, country, password, email, profilePic) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, firstname, lastname, country, hashedPassword, email, profilePic]
        );

        res.status(201).send({ message: "user created", success: true });
    } catch (error) {
        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        const users = await DButils.execQuery(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).send({ success: false, message: "Username or Password incorrect" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, users[0].password);
        if (!isPasswordCorrect) {
            return res.status(401).send({ success: false, message: "Username or Password incorrect" });
        }

        // Create a session
        req.session.user_id = users[0].user_id;

        // Send back user data and token
        const user = {
            id: users[0].user_id,
            username: users[0].username,
            firstname: users[0].firstname,
            lastname: users[0].lastname,
            email: users[0].email,
            country: users[0].country,
            profilePic: users[0].profilePic
        };

        // Generate a token (you might want to use JWT here)
        const token = req.session.id; // Using session ID as token for now

        res.status(200).send({ 
            success: true, 
            message: "login succeeded",
            user,
            token
        });
    } catch (error) {
        next(error);
    }
});

router.post("/logout", function (req, res) {
    if (!req.session || !req.session.user_id) {
        return res.status(401).send({ success: false, message: "no active session" });
    }
    req.session.reset();
    res.status(200).send({ success: true, message: "logout succeeded" });
});

module.exports = router;