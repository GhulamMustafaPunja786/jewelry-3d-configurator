import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { METALS } from "../data/metals";
import { STONES } from "../data/stones";
import { RING_MODELS } from "../data/models";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@jewelry.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeAdmin123!";
  const adminName = process.env.ADMIN_NAME || "Studio Admin";

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName, role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
    },
  });

  for (const metal of METALS) {
    await prisma.metal.upsert({
      where: { code: metal.code },
      update: {
        name: metal.name,
        type: metal.type,
        karat: metal.karat,
        color: metal.color,
        colorHex: metal.colorHex,
        metalness: metal.metalness,
        roughness: metal.roughness,
        pricePerGram: metal.pricePerGram,
        isActive: true,
      },
      create: {
        name: metal.name,
        code: metal.code,
        type: metal.type,
        karat: metal.karat,
        color: metal.color,
        colorHex: metal.colorHex,
        metalness: metal.metalness,
        roughness: metal.roughness,
        pricePerGram: metal.pricePerGram,
      },
    });
  }

  for (const stone of STONES) {
    await prisma.stone.upsert({
      where: { code: stone.code },
      update: {
        name: stone.name,
        type: stone.type,
        shape: stone.shape,
        colorHex: stone.colorHex,
        transmission: stone.transmission,
        ior: stone.ior,
        pricePerCarat: stone.pricePerCarat,
        isActive: true,
      },
      create: {
        name: stone.name,
        code: stone.code,
        type: stone.type,
        shape: stone.shape,
        colorHex: stone.colorHex,
        transmission: stone.transmission,
        ior: stone.ior,
        pricePerCarat: stone.pricePerCarat,
      },
    });
  }

  const ringProduct = await prisma.jewelryProduct.upsert({
    where: { slug: "rings" },
    update: {
      name: "Rings",
      category: "ring",
      description: "Engagement and fashion rings",
      isActive: true,
    },
    create: {
      slug: "rings",
      name: "Rings",
      category: "ring",
      description: "Engagement and fashion rings",
      basePrice: 500,
    },
  });

  for (const model of RING_MODELS) {
    await prisma.jewelryModel.upsert({
      where: {
        productId_slug: { productId: ringProduct.id, slug: model.slug },
      },
      update: {
        name: model.name,
        modelUrl: model.modelUrl,
        isActive: true,
      },
      create: {
        productId: ringProduct.id,
        name: model.name,
        slug: model.slug,
        modelUrl: model.modelUrl,
      },
    });
  }

  const rules = [
    {
      name: "Default labor",
      category: "ring",
      ruleType: "labor",
      valueType: "fixed",
      value: 185,
      priority: 10,
      description: "Base craftsmanship fee",
    },
    {
      name: "Making charge",
      category: "ring",
      ruleType: "making_charge",
      valueType: "percent",
      value: 12,
      priority: 20,
      description: "Percent of metal + stone",
    },
    {
      name: "Sales tax",
      category: null,
      ruleType: "tax",
      valueType: "percent",
      value: 8,
      priority: 100,
      description: "Default tax rate",
    },
  ] as const;

  for (const rule of rules) {
    const existing = await prisma.pricingRule.findFirst({
      where: { name: rule.name, category: rule.category },
    });
    if (existing) {
      await prisma.pricingRule.update({
        where: { id: existing.id },
        data: {
          ruleType: rule.ruleType,
          valueType: rule.valueType,
          value: rule.value,
          priority: rule.priority,
          description: rule.description,
          isActive: true,
        },
      });
    } else {
      await prisma.pricingRule.create({
        data: {
          name: rule.name,
          category: rule.category,
          ruleType: rule.ruleType,
          valueType: rule.valueType,
          value: rule.value,
          priority: rule.priority,
          description: rule.description,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
