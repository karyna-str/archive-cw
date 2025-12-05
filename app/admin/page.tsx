import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download } from "lucide-react";
import Link from "next/link";
import { deleteBook } from "@/app/actions";

export default async function AdminPage() {
    const user = await currentUser();
    const isAdmin = user?.publicMetadata?.role === "admin";
    
    if (!user || !isAdmin) {
        redirect("/");
    }
    
    const allBooks = await db.book.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Панель Адміністратора</h1>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Назва</TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Власник (User ID)</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead className="text-right">Дії</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allBooks.map((book) => (
                            <TableRow key={book.id}>
                                <TableCell className="font-medium">
                                    <a href={book.fileUrl || "#"} target="_blank" className="hover:underline">
                                        {book.title}
                                    </a>
                                </TableCell>
                                <TableCell>{book.type}</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">
                                    {book.userId}
                                </TableCell>
                                <TableCell>
                                    {new Date(book.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        "use server";
                                        await deleteBook(book.id);
                                    }}>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 size={16} />
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}