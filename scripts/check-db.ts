import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.count();
    const designs = await prisma.design.count();
    const metals = await prisma.metal.count();
    console.log(`OK users=${users} designs=${designs} metals=${metals}`);
  } catch (error) {
    console.error(
      "DB_ERR",
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
