import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../../lib/auth-edge';
import { ensureDatabaseSchema } from '../../../../lib/db-init';

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
 * GET /api/rpg/profile
 * Obtiene el perfil RPG del usuario autenticado guardado en D1
 */
export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = resolveUserId(token);
  const db = await getDB();

  if (!db) {
    return NextResponse.json({ success: true, fromCloud: false, message: 'Entorno local / memoria' });
  }

  try {
    await ensureDatabaseSchema(db);
    const row = await db.prepare('SELECT * FROM rpg_profiles WHERE user_id = ?').bind(userId).first();

    if (!row) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      fromCloud: true,
      profile: {
        level: row.level,
        exp: row.exp,
        expNext: row.exp_next,
        polvoEstelar: row.polvo_estelar,
        sign: row.sign,
        element: row.element,
        maxHouseCleared: row.max_house_cleared,
        pvpRank: row.pvp_rank,
        equipped: {
          weapon: row.equipped_weapon ? JSON.parse(row.equipped_weapon) : null,
          armor: row.equipped_armor ? JSON.parse(row.equipped_armor) : null,
          relic: row.equipped_relic ? JSON.parse(row.equipped_relic) : null,
        },
        inventory: row.inventory ? JSON.parse(row.inventory) : []
      }
    });
  } catch (err) {
    console.error('Error al obtener perfil RPG de D1:', err);
    return NextResponse.json({ error: 'Error de base de datos' }, { status: 500 });
  }
}

/**
 * POST /api/rpg/profile
 * Guarda o actualiza el perfil RPG del usuario en D1
 */
export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = resolveUserId(token);
  const body = await request.json();
  const db = await getDB();

  if (!db) {
    return NextResponse.json({ success: true, fromCloud: false });
  }

  try {
    await ensureDatabaseSchema(db);

    const level = body.level || 1;
    const exp = body.exp || 0;
    const expNext = body.expNext || 150;
    const polvoEstelar = body.polvoEstelar || 0;
    const sign = body.sign || 'Aries';
    const element = body.element || 'Fuego';
    const maxHouse = body.maxHouseCleared || 0;
    const pvpRank = body.pvpRank || 'Polvo Estelar I';
    const eqWeapon = body.equipped?.weapon ? JSON.stringify(body.equipped.weapon) : null;
    const eqArmor = body.equipped?.armor ? JSON.stringify(body.equipped.armor) : null;
    const eqRelic = body.equipped?.relic ? JSON.stringify(body.equipped.relic) : null;
    const inventoryStr = JSON.stringify(body.inventory || []);

    await db.prepare(`
      INSERT INTO rpg_profiles (
        user_id, level, exp, exp_next, polvo_estelar, sign, element,
        max_house_cleared, pvp_rank, equipped_weapon, equipped_armor, equipped_relic, inventory, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        level = excluded.level,
        exp = excluded.exp,
        exp_next = excluded.exp_next,
        polvo_estelar = excluded.polvo_estelar,
        max_house_cleared = excluded.max_house_cleared,
        pvp_rank = excluded.pvp_rank,
        equipped_weapon = excluded.equipped_weapon,
        equipped_armor = excluded.equipped_armor,
        equipped_relic = excluded.equipped_relic,
        inventory = excluded.inventory,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId, level, exp, expNext, polvoEstelar, sign, element,
      maxHouse, pvpRank, eqWeapon, eqArmor, eqRelic, inventoryStr
    ).run();

    return NextResponse.json({ success: true, fromCloud: true });
  } catch (err) {
    console.error('Error al guardar perfil RPG en D1:', err);
    return NextResponse.json({ error: 'Error al sincronizar' }, { status: 500 });
  }
}
