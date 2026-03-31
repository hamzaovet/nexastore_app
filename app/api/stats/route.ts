import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Expense from '@/models/Expense';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // 1. تجميع الإحصائيات بذكاء (بنفصل السليم عن المرتجع)
    const salesStats = await Sale.aggregate([
      {
        $group: {
          _id: null,
          // الإيرادات الصافية (المبيعات المكتملة فقط)
          totalRevenue: {
            $sum: {
              $cond: [
                { $ne: ["$status", "returned"] },
                { $multiply: ["$actualSalePrice", { $ifNull: ["$qty", "$quantity", 1] }] },
                0
              ]
            }
          },
          // التكاليف الصافية (للمبيعات المكتملة فقط)
          totalCost: {
            $sum: {
              $cond: [
                { $ne: ["$status", "returned"] },
                { $multiply: ["$costAtSale", { $ifNull: ["$qty", "$quantity", 1] }] },
                0
              ]
            }
          },
          // مردودات المبيعات (إجمالي قيمة البيع اللي رجع - العفريت بتاعنا!)
          totalReturns: {
            $sum: {
              $cond: [
                { $eq: ["$status", "returned"] },
                { $multiply: ["$actualSalePrice", { $ifNull: ["$qty", "$quantity", 1] }] },
                0
              ]
            }
          }
        }
      }
    ]);

    const totalRevenue = salesStats[0]?.totalRevenue || 0;
    const totalCost    = salesStats[0]?.totalCost || 0;
    const totalReturns = salesStats[0]?.totalReturns || 0; // ده الرقم الجديد اللي هنعرضه

    // 2. إجمالي المصروفات
    const expenseStats = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" }
        }
      }
    ]);
    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    // 3. إجمالي قيمة المخزون
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalInventoryValue: { $sum: { $multiply: [{ $ifNull: ["$stock", "$quantity", 0] }, "$costPrice"] } }
        }
      }
    ]);
    const totalInventoryValue = productStats[0]?.totalInventoryValue || 0;

    // 4. صافي الربح
    const netProfit = totalRevenue - totalCost - totalExpenses;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalCost,
        totalExpenses,
        totalReturns, // بعتناها للواجهة أهي
        netProfit,
        totalInventoryValue
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 خطأ الإحصائيات:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}