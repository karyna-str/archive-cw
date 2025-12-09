import { db } from "@/lib/db";
import BookActions from "@/components/BookActions";
import { Search } from "@/components/Search";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Download, FileText, BookOpen, Library } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sort } from "@/components/Sort";
import { Prisma } from "@prisma/client";

export default async function Home({searchParams}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> })
{
    const user = await currentUser();

    if (!user) {
        return (
            <main className="container mx-auto p-4 max-w-5xl h-screen flex flex-col items-center justify-center text-center">
                <div className="bg-secondary/30 p-10 rounded-2xl border border-border">
                    <Library className="w-20 h-20 mx-auto mb-6 text-primary" />
                    <h1 className="text-4xl font-bold mb-4">Вітаємо в Archive Hub</h1>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                        Ваш персональний простір для зберігання книг, документів та нотаток.
                        Увійдіть, щоб отримати доступ до своєї бібліотеки.
                    </p>
                    <SignInButton mode="modal">
                        <Button size="lg" className="text-lg px-8">Розпочати роботу</Button>
                    </SignInButton>
                </div>
            </main>
        );
    }

    const resolvedParams = await searchParams;
    const q = resolvedParams.q;
    const sort = resolvedParams.sort;
    const query = typeof q === "string" ? q : undefined;
    const sortOption = typeof sort === "string" ? sort : "newest";

    let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: "desc" };

    switch (sortOption) {
        case "oldest":
            orderBy = { createdAt: "asc" };
            break;
        case "title_asc":
            orderBy = { title: "asc" };
            break;
        case "title_desc":
            orderBy = { title: "desc" };
            break;
        case "newest":
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

    const books = await db.book.findMany({
        where: {
            userId: user.id,
            ...(query
                ? {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { category: { name: { contains: query, mode: "insensitive" } } },
                        { author: { name: { contains: query, mode: "insensitive" } } },
                        { description: { contains: query, mode: "insensitive" } },
                    ],
                }
                : {}),
        },
        include: {
            category: true,
            author: true,
        },
        orderBy: orderBy,
    });

    return (
        <main className="container mx-auto p-4 max-w-5xl">
            <div className="flex justify-between items-center mb-8 mt-4">
                <h1 className="text-3xl font-bold text-foreground">Архів Текстів</h1>
                <div className="flex gap-2">
                    <SignedIn>
                        <BookActions />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button>Увійти</Button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>

            <div className="mb-6 flex gap-4">
                <Search />
                <Sort />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => {
                    const isOwner = user?.id === book.userId;
                    const lowerUrl = book.fileUrl?.toLowerCase() || "";
                    const isPdf =
                        book.type === 'PDF' ||
                        lowerUrl.includes('.pdf');
                    const isEpub =
                        book.type === 'EPUB' ||
                        lowerUrl.includes('.epub');
                    const isImage =
                        book.type === 'IMAGE' ||
                        lowerUrl.match(/\.(jpg|jpeg|png|webp)$/);
                    const isText =
                        book.type === 'TEXT';

                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                    if (isPdf) badgeVariant = "destructive";
                    if (isEpub) badgeVariant = "default";
                    if (isImage) badgeVariant = "outline";

                    return (
                        <Card
                            key={book.id}
                            className="relative border bg-card text-card-foreground rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                            <CardHeader className="pb-2 pt-4 px-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <Badge variant={badgeVariant}>
                                            {isPdf ? "PDF" : isEpub ? "EPUB" : isImage ? "IMG" : "DOC"}
                                        </Badge>

                                        {book.size && book.size > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {(book.size / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        )}

                                        {book.wordCount > 0 && (
                                            <>
                                                {(book.size && book.size > 0) && <span className="text-muted-foreground">•</span>}
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {book.wordCount.toLocaleString()} слів
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {isOwner && (
                                        <div className="-mt-1 -mr-2">
                                            <BookActions bookToEdit={{
                                                id: book.id,
                                                title: book.title,
                                                description: book.description,
                                                content: book.content,
                                                type: book.type,
                                                language: book.language,
                                                author: book.author ? { name: book.author.name } : null,
                                                category: book.category ? { name: book.category.name } : null,
                                            }} />
                                        </div>
                                    )}
                                </div>

                                <CardTitle className="text-lg leading-tight line-clamp-2">{book.title}</CardTitle>

                                {book.description && (
                                    <p className="text-xs text-primary mt-1 line-clamp-1 font-medium">
                                        {book.description}
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="flex-grow px-0">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Автор: <span className="font-medium text-foreground">{book.author?.name || "Невідомий"}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Категорія: <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{book.category?.name || "Інше"}</span>
                                </p>
                            </CardContent>

                            <CardFooter className="pt-0 mt-auto gap-2 px-0">
                                {(isPdf || isImage) && (
                                    <a href={`/api/download/${book.id}`} target="_blank" rel="noopener noreferrer" className="w-full">
                                        <Button variant="default" size="sm" className="w-full gap-2">
                                            <FileText size={16} /> Відкрити
                                        </Button>
                                    </a>
                                )}
                                {(isEpub || (!isPdf && !isText && !isImage)) && (
                                    <a href={`/api/download/${book.id}`} download className="w-full">
                                        <Button variant="default" size="sm" className="w-full gap-2">
                                            <Download size={16} /> Скачати {isEpub ? "EPUB" : "файл"}
                                        </Button>
                                    </a>
                                )}
                                {isText && (
                                    <Link href={`/read/${book.id}`} className="w-full">
                                        <Button variant="default" size="sm" className="w-full gap-2">
                                            <BookOpen size={16} /> Читати
                                        </Button>
                                    </Link>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}

                {books.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                        {query ? "Нічого не знайдено." : "Бібліотека пуста. Додайте першу книгу!"}
                    </div>
                )}
            </div>
        </main>
    );
}