import { loadEnv } from "./env.js";
import { ensureDemoOwner } from "./services/forms.js";
import { prisma } from "@webform/db";

async function main() {
  const env = loadEnv();
  const owner = await ensureDemoOwner(env.DEMO_OWNER_EMAIL);
  console.log(JSON.stringify({ ownerId: owner.id, email: owner.email }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
