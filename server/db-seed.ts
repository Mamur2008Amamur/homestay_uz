import "dotenv/config";
import { STAYS } from "../client/src/data/stays";
import { getDb, seedStaysFromCatalog } from "./db";

async function main() {
  const db = await getDb();
  if (!db) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const count = await seedStaysFromCatalog(STAYS);
  console.log(`Seeded ${count} stays into the database.`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
