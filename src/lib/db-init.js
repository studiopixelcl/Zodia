/**
 * db-init.js
 * Módulo centralizado para garantizar que las tablas de Cloudflare D1
 * contengan todas las columnas y esquemas necesarios sin fallar.
 */

let isSchemaEnsured = false;

export async function ensureDatabaseSchema(db) {
  if (!db || isSchemaEnsured) return;

  const statements = [
    // 1. Tabla users base y columnas extendidas
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    "ALTER TABLE users ADD COLUMN nombre_completo TEXT",
    "ALTER TABLE users ADD COLUMN nombre_actual TEXT",
    "ALTER TABLE users ADD COLUMN fecha_nacimiento TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
    "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'",
    "ALTER TABLE users ADD COLUMN ban_reason TEXT",
    "ALTER TABLE users ADD COLUMN password_hash TEXT",
    "ALTER TABLE users ADD COLUMN reset_pin TEXT",
    "ALTER TABLE users ADD COLUMN reset_expires INTEGER",
    "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN is_ghost_mode INTEGER DEFAULT 0",

    // 2. Tabla astral_profiles base y columnas extendidas
    `CREATE TABLE IF NOT EXISTS astral_profiles (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    "ALTER TABLE astral_profiles ADD COLUMN video_url TEXT",
    "ALTER TABLE astral_profiles ADD COLUMN photos TEXT",
    "ALTER TABLE astral_profiles ADD COLUMN interests TEXT",
    "ALTER TABLE astral_profiles ADD COLUMN is_verified INTEGER DEFAULT 0",
    "ALTER TABLE astral_profiles ADD COLUMN is_ghost_mode INTEGER DEFAULT 0",

    // 3. Tabla resonances
    `CREATE TABLE IF NOT EXISTS resonances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 4. Tabla messages
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 5. Tabla interactions
    `CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 6. Tablas de notificaciones push
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      subscription_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      url TEXT,
      type TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 7. Tablas del Muro Cósmico & Feed de Resonancias
    `CREATE TABLE IF NOT EXISTS feed_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_image TEXT,
      author_sign TEXT,
      author_element TEXT,
      content TEXT NOT NULL,
      media_url TEXT,
      vibe_tag TEXT DEFAULT 'Reflexión ✨',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feed_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id, type)
    )`,
    `CREATE TABLE IF NOT EXISTS feed_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_image TEXT,
      author_sign TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // 8. Historias Efímeras Cósmicas (Stories 24h)
    `CREATE TABLE IF NOT EXISTS astral_stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_image TEXT,
      author_sign TEXT,
      media_url TEXT NOT NULL,
      caption TEXT,
      vibe_tag TEXT DEFAULT '✨ Energía del Día',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )`,

    // 9. Citas a Ciegas Cósmicas (Speed Dating Astral)
    `CREATE TABLE IF NOT EXISTS blind_dates (
      id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      user_a_revealed INTEGER DEFAULT 0,
      user_b_revealed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )`,

    // 10. Perfiles y Progreso de Chronicles of the Zodia RPG
    `CREATE TABLE IF NOT EXISTS rpg_profiles (
      user_id TEXT PRIMARY KEY,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      exp_next INTEGER DEFAULT 150,
      polvo_estelar INTEGER DEFAULT 100,
      sign TEXT NOT NULL,
      element TEXT NOT NULL,
      max_house_cleared INTEGER DEFAULT 0,
      pvp_rank TEXT DEFAULT 'Polvo Estelar I',
      equipped_weapon TEXT,
      equipped_armor TEXT,
      equipped_relic TEXT,
      inventory TEXT DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const sql of statements) {
    try {
      await db.prepare(sql).run();
    } catch {
      // Ignorar si la columna o tabla ya existe
    }
  }

  isSchemaEnsured = true;
}
