import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@isyurtlari/database";

const db = new PrismaClient();

const ADMIN_SECRET = process.env.ADMIN_SEED_SECRET;

const productsToSeed = [
  {
    slug: "elban-foca-naturel-sizma-zeytinyagi-5-lt",
    name: "Elban Foça Naturel Sızma Zeytinyağı 5 lt",
    category: "gida",
    price: 2350.0,
  },
  {
    slug: "elban-kizilcik-receli-420-gr",
    name: "Elban Kızılcık Reçeli 420 gr",
    category: "gida",
    price: 175.0,
  },
  {
    slug: "advem-japon-kirazi-cicegi-kolonyasi",
    name: "ADVEM Japon Kirazı Çiçeği Kolonyası",
    category: "temizlik",
    price: 216.0,
  },
  {
    slug: "zenbay-kutahya-kucuk-cini-saksi",
    name: "Zenbay Kütahya Küçük Çini Saksı",
    category: "hediyelik",
    price: 0,
  },
  {
    slug: "elban-salgam-suyu-acili",
    name: "Elban Şalgam Suyu Acılı",
    category: "gida",
    price: 42.0,
  },
  {
    slug: "elban-bogurtlen-receli-pet-kavanoz-1000-gr",
    name: "Elban Böğürtlen Reçeli Pet Kavanoz 1000 gr",
    category: "gida",
    price: 315.0,
  },
  {
    slug: "elban-osmancik-pirinc-2-kg",
    name: "Elban Osmancık Pirinç 2 kg",
    category: "gida",
    price: 216.0,
  },
  {
    slug: "cini-kutulu-set-kirmizi-kadife-kutu-fincan-kase",
    name: "Çini Kutulu Set (kırmızı kadife kutu, fincan/kase)",
    category: "hediyelik",
    price: 1160.0,
  },
];

const categoryNames: Record<string, string> = {
  gida: "Gıda",
  temizlik: "Temizlik",
  hediyelik: "Hediyelik",
  tekstil: "Tekstil",
  ahsap: "Ahşap",
};

export async function POST(request: NextRequest) {
  // Development ortamında test amacıyla koşulsuz
  // Production'da secret kontrolü gerekli
  if (process.env.NODE_ENV === "production") {
    const secret = request.headers.get("x-admin-seed-secret");
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const results: any[] = [];

    // Kategorileri kontrol et/oluştur
    for (const [slug, name] of Object.entries(categoryNames)) {
      const category = await db.productCategory.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          kdvOrani: 10,
        },
      });
      results.push({ type: "category", status: "ok", name });
    }

    // Ürünleri ekle
    for (const product of productsToSeed) {
      const category = await db.productCategory.findUnique({
        where: { slug: product.category },
      });

      if (!category) {
        results.push({
          type: "product",
          slug: product.slug,
          status: "error",
          error: "Category not found",
        });
        continue;
      }

      const existing = await db.product.findUnique({
        where: { slug: product.slug },
      });

      if (existing) {
        results.push({
          type: "product",
          slug: product.slug,
          status: "skipped",
          reason: "Already exists",
        });
        continue;
      }

      await db.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.name,
          categoryId: category.id,
          price: product.price,
          quantity: 0,
          vatRate: 10,
        },
      });

      results.push({
        type: "product",
        slug: product.slug,
        name: product.name,
        price: product.price,
        status: "created",
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Seed completed",
      results,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
