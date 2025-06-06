-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    profilePic VARCHAR(255)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id INT,
    recipe_id INT,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create recipe_progress table
CREATE TABLE IF NOT EXISTS recipe_progress (
    user_id INT,
    recipe_id INT,
    last_step INT DEFAULT 0,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create family_recipes table
CREATE TABLE IF NOT EXISTS family_recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    traditional_date VARCHAR(255),
    ingredients JSON,
    instructions JSON,
    photos JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create user_recipes table
CREATE TABLE IF NOT EXISTS user_recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSON,
    instructions JSON,
    photos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create user_history table
CREATE TABLE IF NOT EXISTS user_history (
    user_id INT,
    recipe_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id, timestamp),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
); 