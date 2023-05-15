-- INSERT für die Credentials-Tabelle
INSERT INTO credentials (username, password) VALUES ('HeMaNi', '123456');

-- INSERT für die User-Tabelle
INSERT INTO user (credentialsId, profilePictureUrl, name, status, isOnline) VALUES (1, 'https://picsum.photos/200', 'HeMaNi', 'Der 180 Pro', 1);

-- INSERT für die Achievement-Tabelle
INSERT INTO achievement (userId, name, imageUrl, description) VALUES (1, 'Erster!', 'https://picsum.photos/200', 'Du bist der erste Account auf der offiziellen, lizensierten SmartDartTM-Datenbank! Spaß');
