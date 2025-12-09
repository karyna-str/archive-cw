import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteBook } from "@/app/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
    const user = await currentUser();

    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const isAdmin = metadata?.role === "admin";

    if (!user || !isAdmin) {
        redirect("/");
    }

    const allBooks = await db.book.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            category: true,
            author: true
        }
    });

    const downloadLogs = await db.downloadLog.findMany({
        orderBy: { downloadedAt: "desc" },
        include: { book: true },
    });

    const allAuthors = await db.author.findMany({
        orderBy: { name: "asc" },
        include: {
            books: true, // Щоб порахувати кількість книг
        },
    });

    const allCategories = await db.category.findMany({
        orderBy: { name: "asc" },
        include: {
            books: true,
        },
    });

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold mb-6">Панель Адміністратора</h1>
            </div>

            <Tabs defaultValue="books" className="w-full">
                <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="books">Книги ({allBooks.length})</TabsTrigger>
                    <TabsTrigger value="authors">Автори ({allAuthors.length})</TabsTrigger>
                    <TabsTrigger value="categories">Категорії ({allCategories.length})</TabsTrigger>
                    <TabsTrigger value="logs">Логи ({downloadLogs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="books">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                            <TableHead>Назва</TableHead>
                            <TableHead>Автор</TableHead>
                            <TableHead>Категорія</TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Власник</TableHead>
                            <TableHead className="text-right">Дії</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allBooks.map((book) => {
                                    const linkTarget = book.type === "TEXT" ? `/read/${book.id}` : (book.fileUrl || "#");
                                    return (
                                        <TableRow key={book.id}>
                                            <TableCell className="font-medium">
                                                <a href={linkTarget} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500 flex items-center gap-2">
                                                    {book.title}
                                                    <ExternalLink size={12} />
                                                </a>
                                            </TableCell>
                                            <TableCell>{book.author?.name || "—"}</TableCell>
                                            <TableCell>{book.category?.name || "—"}</TableCell>
                                            <TableCell><span className="text-xs font-mono font-bold">{book.type}</span></TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{book.userId.slice(0, 10)}...</TableCell>
                                            <TableCell className="text-right">
                                                <form action={deleteBook.bind(null, book.id)}>
                                                    <Button variant="destructive" size="sm" type="submit"><Trash2 size={16} /></Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="authors">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Автора</TableHead>
                                    <TableHead>Ім'я</TableHead>
                                    <TableHead>Кількість книг</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allAuthors.map((author) => (
                                    <TableRow key={author.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{author.id}</TableCell>
                                        <TableCell className="font-medium text-lg">{author.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{author.books.length} книг</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="categories">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Категорії</TableHead>
                                    <TableHead>Назва</TableHead>
                                    <TableHead>Кількість книг</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allCategories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{cat.id}</TableCell>
                                        <TableCell className="font-medium text-lg">{cat.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{cat.books.length} книг</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Логу</TableHead>
                                    <TableHead>Книга</TableHead>
                                    <TableHead>Користувач</TableHead>
                                    <TableHead className="text-right">Час</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {downloadLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{log.id.slice(0, 8)}...</TableCell>
                                        <TableCell className="font-medium">{log.book ? log.book.title : <span className="text-red-500">Книгу видалено</span>}</TableCell>
                                        <TableCell className="text-xs font-mono">{log.userId}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{new Date(log.downloadedAt).toLocaleString("uk-UA")}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}