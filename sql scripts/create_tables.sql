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
    title VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    traditional_date VARCHAR(255),
    ingredients JSON,
    instructions JSON,
    photos JSON
);

-- Insert initial family recipes
INSERT INTO family_recipes (title, created_by, traditional_date, ingredients, instructions, photos) VALUES
('Grandma's Apple Pie', 'Grandma Ruth', 'Thanksgiving',
  '["6 apples", "1 cup sugar", "2 cups flour", "1/2 cup butter", "1 tsp cinnamon"]',
  '["Peel and slice apples.", "Mix apples with sugar and cinnamon.", "Prepare crust with flour and butter.", "Fill crust with apple mixture.", "Bake at 180C for 45 minutes."]',
  '["https://example.com/apple_pie.jpg"]'
),
('Uncle Joe's Shakshuka', 'Uncle Joe', 'Family Brunch',
  '["4 eggs", "2 cups tomato sauce", "1 onion", "1 bell pepper", "Spices"]',
  '["Chop onion and pepper.", "Sauté in pan.", "Add tomato sauce and simmer.", "Make wells and crack eggs.", "Cook until eggs set."]',
  '["https://example.com/shakshuka.jpg"]'
),
('Mom's Chicken Soup', 'Mom', 'Passover',
  '["1 whole chicken", "3 carrots", "2 celery stalks", "1 onion", "Salt and pepper"]',
  '["Place chicken in pot.", "Add vegetables and cover with water.", "Simmer for 2 hours.", "Season to taste.", "Serve hot."]',
  '["https://example.com/chicken_soup.jpg"]'
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