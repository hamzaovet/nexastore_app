import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const saleId = resolvedParams.id;
    
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return NextResponse.json({ success: false, message: 'العملية غير موجودة' }, { status: 404 });
    }

    // 🔥 الحماية هنا: لو البيعة دي مرتجعة قبل كده، ارفض العملية فوراً
    if (sale.status === 'returned') {
      return NextResponse.json({ success: false, message: 'هذه العملية مرتجعة بالفعل وتمت إضافة الكمية للمخزون' }, { status: 400 });
    }

    // 2. نرجع الكمية للمخزون
    const product = await Product.findById(sale.productId);
    if (product) {
      if (product.stock !== undefined) {
        product.stock += sale.qty;
      } else {
        product.quantity += sale.qty;
      }
      await product.save();
    }

    // 3. نغير الحالة لمرتجع
    sale.status = 'returned';
    await sale.save();

    return NextResponse.json({ success: true, data: sale }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}