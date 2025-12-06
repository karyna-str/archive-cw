import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { currentUser, auth } from "@clerk/nextjs/server";
import BookActions from "@/components/BookActions";
import TextEditor from "@/components/TextEditor";

export default async function ReadPage({params}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { userId } = await auth();
    const user = await currentUser();

    const book = await db.book.findUnique({
        where: { id },
        include: {
            category: true,
            author: true
        }
    });

    if (!book) return notFound();

    const isOwner = user?.id === book.userId;

    // Визначаємо типи
    const lowerUrl = book.fileUrl?.toLowerCase() || "";
    const isPdf = book.type === 'PDF' || lowerUrl.includes('.pdf');
    const isImage = book.type === 'IMAGE' || lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)$/);

    // Отримуємо текст
    let displayText = book.content;

    if (!displayText && book.fileUrl && !isPdf && !isImage) {
        try {
            const response = await fetch(book.fileUrl);
            displayText = await response.text();
        } catch (error) {
            console.error("Error loading text:", error);
            displayText = "Помилка завантаження тексту.";
        }
    }

    await db.downloadLog.create({
        data: {
            bookId: book.id,
            userId: userId || "guest",
        }
    });

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            {/* Навігація */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 items-center">
                    <Link href="/">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                        </Button>
                    </Link>

                    {/* Ця кнопка (олівець) тепер редагує ТІЛЬКИ МЕТАДАНІ (Назву, Автора) */}
                    {isOwner && (
                        <BookActions bookToEdit={{
                            id: book.id,
                            title: book.title,
                            description: book.description,
                            // content не передаємо, бо редагуємо його в іншому місці
                            type: book.type,
                            language: book.language,
                            author: book.author ? { name: book.author.name } : null,
                            category: book.category ? { name: book.category.name } : null,
                        }} />
                    )}
                </div>

                {book.fileUrl && (
                    <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Скачати файл
                        </Button>
                    </a>
                )}
            </div>

            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold mb-2 text-foreground">{book.title}</h1>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Автор: {book.author?.name || "Невідомий"}</span>
                    <span>•</span>
                    <span>Слів: {book.wordCount}</span>
                </div>
            </div>

            {/* 🔥 ЗОНА КОНТЕНТУ */}
            {isImage ? (
                // Картинка
                <div className="flex justify-center bg-muted/20 p-4 rounded-lg border min-h-[50vh] items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.fileUrl!} alt={book.title} className="max-w-full h-auto rounded shadow-md" />
                </div>
            ) : isPdf ? (
                // PDF
                <div className="text-center py-20 bg-muted/20 rounded-lg border">
                    <p className="mb-6 text-muted-foreground text-lg">PDF файли краще переглядати у повному вікні.</p>
                    <a href={book.fileUrl!} target="_blank" rel="noopener noreferrer">
                        <Button size="lg"><Download className="mr-2 h-5 w-5"/> Відкрити PDF</Button>
                    </a>
                </div>
            ) : (
                // 👇 2. ТЕКСТ: Якщо ти власник - показуємо РЕДАКТОР. Якщо ні - просто текст.
                isOwner ? (
                    <TextEditor bookId={book.id} initialContent={displayText || ""} />
                ) : (
                    <div className="bg-card text-card-foreground p-6 md:p-10 rounded-lg shadow-sm border min-h-[50vh]">
                        <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed break-words">
                            {displayText || "Текст відсутній."}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}