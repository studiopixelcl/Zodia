export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

/**
 * Endpoint: GET /api/check-user?name=<term>
 * Propósito: Comprueba si un sintonizador ya está registrado en la base de datos D1.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nameQuery = searchParams.get('name')?.trim();

    const action = searchParams.get('action');

    // Sincronización directa e infalible desde el cliente sin requerir cookies
    if (action === 'sync') {
      const syncEmail = searchParams.get('email')?.toLowerCase().trim();
      const syncName = searchParams.get('name')?.trim() || 'Sintonizador';
      const syncImage = searchParams.get('image')?.trim();
      const syncDob = searchParams.get('dob')?.trim() || '1998-07-15';
      const syncId = searchParams.get('id')?.trim() || ('tuner_' + (syncEmail ? syncEmail.replace(/[@.]/g, '_') : Date.now()));

      if (db && syncEmail) {
        try {
          const { ensureDatabaseSchema } = await import('../../../lib/db-init');
          await ensureDatabaseSchema(db);

          const defaultHash = 'oauth_' + Date.now() + '_' + Math.random().toString(36).slice(2);
          try {
            await db.prepare(`
              INSERT INTO users (id, email, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url, status, password_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                nombre_actual = excluded.nombre_actual,
                nombre_completo = excluded.nombre_completo,
                fecha_nacimiento = COALESCE(users.fecha_nacimiento, excluded.fecha_nacimiento),
                image = COALESCE(excluded.image, users.image),
                avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
                status = 'active'
            `).bind(syncId, syncEmail, syncName, syncName, syncName, syncDob, syncImage || null, syncImage || null, defaultHash).run();
          } catch (insErr) {
            // Si el correo ya existía en otro ID, actualizar el existente
            await db.prepare(`
              UPDATE users 
              SET name = COALESCE(?, name),
                  nombre_actual = COALESCE(?, nombre_actual),
                  image = COALESCE(?, image),
                  avatar_url = COALESCE(?, avatar_url),
                  status = 'active'
              WHERE LOWER(email) = LOWER(?)
            `).bind(syncName, syncName, syncImage || null, syncImage || null, syncEmail).run();
          }

          const { calculateAstralProfile } = await import('../../../lib/astrology');
          const astral = calculateAstralProfile(syncDob);

          await db.prepare(`
            INSERT INTO astral_profiles (
              user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, intent, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Citas y Pareja', 'Santiago, Chile')
            ON CONFLICT(user_id) DO UPDATE SET
              birth_date = excluded.birth_date,
              sign = excluded.sign,
              element = excluded.element
          `).bind(
            syncId, syncDob, astral.sign, astral.element, astral.lifePath, astral.archetype, astral.luz, astral.sombra
          ).run();

          return new Response(JSON.stringify({ success: true, userId: syncId, message: 'Usuario sincronizado exitosamente en D1.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    if (!nameQuery) {
      return new Response(JSON.stringify({ exists: false, error: "Nombre o identificador requerido." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDB();
    if (!db) {
      return new Response(JSON.stringify({ exists: true, mock: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      if (nameQuery === '__test_insert__') {
        const testId = 'tuner_test_debug_' + Date.now();
        const testEmail = `test_${Date.now()}@gmail.com`;
        let insertError = null;
        try {
          await db.prepare(`
            INSERT INTO users (id, email, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url, status, password_hash)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 'active', ?)
          `).bind(testId, testEmail, 'Test User', 'Test User', 'Test User', 'https://example.com/pic.jpg', 'https://example.com/pic.jpg', 'hash_test_123').run();
        } catch (e) {
          insertError = e.message;
        }
        return new Response(JSON.stringify({ success: !insertError, error: insertError, testId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (nameQuery === '__schema_info__') {
        const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const usersCols = await db.prepare("PRAGMA table_info(users)").all();
        const astralCols = await db.prepare("PRAGMA table_info(astral_profiles)").all();
        const allUsers = await db.prepare("SELECT id, email, name, nombre_actual, nombre_completo, fecha_nacimiento, status FROM users").all();
        const allAstral = await db.prepare("SELECT user_id, birth_date, sign, element FROM astral_profiles").all();
        return new Response(JSON.stringify({
          tables: (tables.results || []).map(t => t.name),
          usersColumns: (usersCols.results || []).map(c => c.name),
          astralColumns: (astralCols.results || []).map(c => c.name),
          users: allUsers.results || [],
          astralProfiles: allAstral.results || []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (nameQuery === '__list_real_users__') {
        const allUsers = await db.prepare(`
          SELECT u.id, u.name, u.email, u.fecha_nacimiento, u.status, p.sign, p.element 
          FROM users u 
          LEFT JOIN astral_profiles p ON p.user_id = u.id 
          WHERE u.id NOT LIKE 'candidate_%' AND u.id NOT LIKE 'guide_%' AND u.id != 'zodia_bot'
        `).all();
        return new Response(JSON.stringify({ exists: true, count: (allUsers.results || []).length, users: allUsers.results || [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const cleanId = nameQuery.replace(/[@.]/g, '_').toLowerCase().replace(/\s+/g, '');
      const userId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;
      const userEmail = nameQuery.includes('@') ? nameQuery.toLowerCase() : `${userId}@zodia.eter`;

      const user = await db.prepare(`
        SELECT u.id, u.name, u.image, p.sign, p.element, p.birth_date
        FROM users u
        LEFT JOIN astral_profiles p ON p.user_id = u.id
        WHERE LOWER(u.name) = LOWER(?) OR u.id = ? OR LOWER(u.email) = LOWER(?) OR u.id = ?
      `).bind(nameQuery, userId, userEmail, nameQuery).first();

      if (user) {
        return new Response(JSON.stringify({
          exists: true,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            sign: user.sign,
            element: user.element,
            birth_date: user.birth_date
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ exists: false, dbError: err.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ exists: false, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
