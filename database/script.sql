-- Credentials-Tabelle
CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT,
    email TEXT,
    phoneNumber TEXT
);

-- Benutzerkonten-Tabelle
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY,
    credentialsId INTEGER,
    profilePictureUrl TEXT,
    name TEXT,
    status TEXT,
    isOnline INTEGER,
    FOREIGN KEY (credentialsId) REFERENCES credentials(id)
);

-- Erfolge-Tabelle
CREATE TABLE IF NOT EXISTS achievement (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    name TEXT,
    imageUrl TEXT,
    description TEXT,
    FOREIGN KEY (userId) REFERENCES user(id)
);
