import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import BookActions from "@/components/BookActions";
import { Search } from "@/components/Search";

interface HomeProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
    const { userId } = await auth();

    const params = await searchParams;
    const query = params.q || "";

    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <h1 className="text-4xl font-bold mb-4">Вітаємо в Archive Hub</h1>
                <p className="text-xl text-gray-600 mb-8">
                    Увійдіть, щоб побачити свою особисту бібліотеку.
                </p>
            </div>
        );
    }

    const books = await db.book.findMany({
        where: {
            userId: userId as string,
            OR: query ? [
                { title: { contains: query, mode: "insensitive" } },
                { author: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }, // Ось тут воно знайде #наука
            ] : undefined,
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    return (
        <main className="container mx-auto py-10 px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Моя Бібліотека</h1>
                    <p className="text-muted-foreground mt-1">
                        Знайдено книг: {books.length}
                    </p>
                </div>
                <Link href="/upload">
                    <Button size="lg" className="shadow-md bg-blue-600 hover:bg-blue-700 text-white">
                        + Додати книгу
                    </Button>
                </Link>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Search />
            </div>

            {books.length === 0 ? (
                query ? (
                        /* Сценарій 1: Нічого не знайдено через ПОШУК */
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg mb-4">
                                Нічого не знайдено за запитом <span className="font-bold text-slate-900">"{query}"</span>.
                            </p>
                            <Link href="/">
                                <Button variant="outline">Очистити пошук</Button>
                            </Link>
                        </div>
                    ) : (
                <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
                    <p className="text-gray-500 text-lg">У вас ще немає книг.</p>
                    <Link href="/upload" className="text-blue-600 hover:underline mt-2 inline-block">
                        Завантажити першу книгу
                    </Link>
                </div>
            )) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map((book) => (
                        <Card key={book.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">

                            <CardHeader className="pb-2 pt-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center">

                                        {/* 🔥 ЗМІНА ТУТ: Розумний Бейдж */}
                                        {(() => {
                                            const lowerUrl = book.fileUrl?.toLowerCase() || "";
                                            const lowerTitle = book.title.toLowerCase();
                                            const isPdf =
                                                // 1. Якщо в базі вже чітко записано PDF (для нових завантажень)
                                                book.type === 'PDF' ||
                                                // 2. Якщо посилання МІСТИТЬ '.pdf' (а не тільки закінчується)
                                                lowerUrl.includes('.pdf') ||
                                                // 3. Якщо користувач написав 'pdf' або 'пдф' у назві книги
                                                lowerTitle.includes('pdf');
                                            // Якщо це PDF - пишемо PDF, якщо ні - DOC або те, що в базі
                                            const badgeText = isPdf ? "PDF" : (book.type === "FILE" ? "DOC" : book.type);

                                            return (
                                                <Badge variant={isPdf ? "destructive" : "secondary"}>
                                                    {badgeText}
                                                </Badge>
                                            );
                                        })()}

                                        {book.size && book.size > 0 && (
                                            <span className="text-xs text-gray-400">
                                                {(book.size / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        )}

                                        {book.wordCount > 0 && (
                                            <>
                                                {/* Роздільник, якщо є і розмір, і слова */}
                                                {(book.size && book.size > 0) && <span className="text-gray-300">•</span>}

                                                <span className="text-xs text-slate-500 font-medium">
                                                    {book.wordCount.toLocaleString()} слів
                                                    </span>
                                            </>
                                        )}
                                    </div>

                                    <BookActions book={{
                                        id: book.id,
                                        title: book.title,
                                        author: book.author,
                                        description: book.description,
                                        category: book.category,
                                        language: book.language
                                    }} />

                                </div>

                                <CardTitle className="text-lg leading-tight line-clamp-2" title={book.title}>
                                    {book.title}
                                </CardTitle>

                                {book.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                        {book.description}
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="flex-grow">
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    {book.author}
                                </p>
                            </CardContent>

                            <CardFooter className="pt-0 mt-auto gap-2">
                                {(() => {
                                        // Перевірка для кнопок (тут у тебе все було правильно)
                                        const isPdf = book.fileUrl && (
                                            book.fileUrl.toLowerCase().endsWith('.pdf') ||
                                            book.title.toLowerCase().endsWith('.pdf') ||
                                            book.type === 'PDF'
                                );
                                        if (isPdf) {
                                            return (
                                            <a
                                                href={book.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full"
                                            >
                                                <Button variant="outline" size="sm" className="w-full gap-2">
                                                    <Download size={16} /> Відкрити PDF
                                                </Button>
                                            </a>
                                        );
                                        }
                                        return (
                                            <Link href={`/read/${book.id}`} className="w-full">
                                                <Button variant="outline" size="sm" className="w-full gap-2">
                                                    <FileText size={16} /> Читати
                                                </Button>
                                            </Link>
                                        );
                                    })()}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

        </main>
    );
}