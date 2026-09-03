-- Tabla de Usuarios (Sintonizadores)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- ID proveniente de Google (sub) o generado
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Perfiles Astrales (Espejo Astral)
CREATE TABLE IF NOT EXISTS astral_profiles (
    user_id TEXT PRIMARY KEY,
    birth_date TEXT NOT NULL,
    sign TEXT NOT NULL,
    element TEXT NOT NULL,
    life_path_number INTEGER NOT NULL,
    archetype TEXT NOT NULL,
    luz TEXT,
    sombra TEXT,
    bio TEXT,
    intent TEXT,
    location TEXT,
    photos TEXT,
    interests TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de Resonancias (Matches/Conexiones)
CREATE TABLE IF NOT EXISTS resonances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a_id TEXT NOT NULL,
    user_b_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_a_id) REFERENCES users(id),
    FOREIGN KEY (user_b_id) REFERENCES users(id)
);

-- Tabla de Mensajes (Vínculos Místicos)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Tabla de Interacciones de Citas (Likes, Passes, Superlikes)
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'like', 'pass', 'superlike'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id),
    UNIQUE(user_id, target_id)
);