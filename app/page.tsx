import { db } from "@/lib/db";
import BookActions from "@/components/BookActions";
import { Search } from "@/components/Search";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home({searchParams}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> })
{
    const user = await currentUser();
    const { q } = await searchParams;
    const query = typeof q === "string" ? q : undefined;

    const books = await db.book.findMany({
        where: {
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
        orderBy: { createdAt: "desc" },
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

            <div className="mb-6">
                <Search />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => {
                    const isOwner = user?.id === book.userId;

                    const lowerUrl = book.fileUrl?.toLowerCase() || "";
                    const isPdf =
                        book.type === 'PDF' ||
                        lowerUrl.includes('.pdf');

                    return (
                        <Card
                            key={book.id}
                            className="relative border bg-card text-card-foreground rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                            <CardHeader className="pb-2 pt-4 px-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <Badge variant={isPdf ? "destructive" : "secondary"}>
                                            {isPdf ? "PDF" : (book.type === "FILE" ? "DOC" : book.type)}
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
                                {book.fileUrl || book.type === "TEXT" ? (
                                    isPdf ? (
                                        <a
                                            href={`/api/download/${book.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full"
                                        >
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <Download size={16} /> Відкрити PDF
                                            </Button>
                                        </a>
                                    ) : (
                                        <Link href={`/read/${book.id}`} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <FileText size={16} /> Читати
                                            </Button>
                                        </Link>
                                    )
                                ) : null}
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