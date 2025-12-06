import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteBook } from "@/app/actions";

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

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Панель Адміністратора</h1>

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
                                        <a
                                            href={linkTarget}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline text-blue-500 flex items-center gap-2"
                                        >
                                            {book.title}
                                            <ExternalLink size={12} />
                                        </a>
                                    </TableCell>
                                    <TableCell>{book.author?.name || "—"}</TableCell>
                                    <TableCell>{book.category?.name || "—"}</TableCell>
                                    <TableCell><span className="text-xs font-mono font-bold">{book.type}</span></TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                        {book.userId.slice(0, 15)}...
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <form action={deleteBook.bind(null, book.id)}>
                                            <Button variant="destructive" size="sm" type="submit">
                                                <Trash2 size={16} />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}