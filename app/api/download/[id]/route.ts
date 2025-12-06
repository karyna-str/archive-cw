import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { userId } = await auth();

    // 1. Знаходимо книгу
    const book = await db.book.findUnique({
        where: { id },
    });

    if (!book || !book.fileUrl) {
        return new Response("Файл не знайдено", { status: 404 });
    }

    // 2. 🔥 ЗАПИСУЄМО ЛОГ (Ось чого не вистачало!)
    await db.downloadLog.create({
        data: {
            bookId: book.id,
            userId: userId || "guest", // Якщо не увійшов - пишемо "guest"
        },
    });

    // 3. Перенаправляємо на реальний файл
    return redirect(book.fileUrl);
}