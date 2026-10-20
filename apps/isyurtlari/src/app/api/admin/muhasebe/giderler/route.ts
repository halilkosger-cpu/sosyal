import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Giderleri Listele
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Gider listeleme hatası:', error);
    return NextResponse.json({ error: 'Giderler listelenemedi' }, { status: 500 });
  }
}

// POST: Yeni Gider Ekle
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { title, category, amount, vatRate, invoiceNo, supplier, notes, date } = body;

    if (!title || !category || amount === undefined || amount <= 0) {
      return NextResponse.json({ error: 'Başlık, kategori ve geçerli bir tutar zorunludur' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category,
        amount: parseFloat(amount),
        vatRate: vatRate !== undefined ? parseFloat(vatRate) : 20,
        invoiceNo: invoiceNo?.trim() || null,
        supplier: supplier?.trim() || null,
        notes: notes?.trim() || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Gider ekleme hatası:', error);
    return NextResponse.json({ error: 'Gider eklenemedi' }, { status: 500 });
  }
}

// DELETE: Gider Sil
export async function DELETE(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Gider ID zorunludur' }, { status: 400 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gider silme hatası:', error);
    return NextResponse.json({ error: 'Gider silinemedi' }, { status: 500 });
  }
}
