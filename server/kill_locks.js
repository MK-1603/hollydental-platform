import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';
(async () => {
  try {
    console.log('Querying users...');
    const res = await db.execute(sql.raw(`SELECT count(*) FROM users;`));
    console.log('Users count:', res.rows[0]);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
