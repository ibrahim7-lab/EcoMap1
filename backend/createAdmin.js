// Usage: node createAdmin.js admin mypassword
const bcrypt = require('bcryptjs');
const db = require('./db');

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.log('Usage: node createAdmin.js <username> <password>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
  console.log('Admin created:', username);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
