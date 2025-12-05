"use client";

import { useState } from "react";
import { MoreVertical, Trash, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteBook, editBook } from "@/app/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookActionsProps {
    book: {
        id: string;
        title: string;
        author: string;
        description: string | null;
        category: string;
        language: string;
    };
}

export default function BookActions({ book }: BookActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Ви впевнені, що хочете видалити цю книгу?")) return;

        setIsLoading(true);
        await deleteBook(book.id);
        setIsLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("id", book.id);

        await editBook(formData as any);

        setIsLoading(false);
        setIsEditOpen(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" suppressHydrationWarning>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редагувати
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Видалити
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редагувати книгу</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Назва</label>
                            <Input name="title" defaultValue={book.title} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Автор</label>
                            <Input name="author" defaultValue={book.author} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Категорія</label>
                            <Select name="category" defaultValue={book.category || "Unsorted"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть категорію" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Book">Книга</SelectItem>
                                    <SelectItem value="Note">Нотатки</SelectItem>
                                    <SelectItem value="Study">Навчання</SelectItem>
                                    <SelectItem value="Docs">Документи</SelectItem>
                                    <SelectItem value="Unsorted">Інше</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div>
                                <label className="text-sm font-medium">Мова</label>
                                <Select name="language" defaultValue={book.language || "uk"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Мова" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uk">Українська</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="ja">Japanese</SelectItem>
                                        <SelectItem value="other">Інша</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Опис / Теги</label>
                            <Textarea
                                name="description"
                                defaultValue={book.description || ""}
                                placeholder="Введіть опис..."
                                className="h-32 resize-none overflow-y-auto break-all whitespace-normal"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                <>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Зберегти зміни
                                </>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}