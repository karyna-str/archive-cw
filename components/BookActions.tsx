"use client";

import { useState } from "react";
import { MoreVertical, Trash, Edit, Loader2, Plus, PenLine } from "lucide-react";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteBook, editBook, createBook } from "@/app/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// 👇 ЗМІНА: Імпортуємо UploadButton замість UploadDropzone
import { UploadButton } from "@/utils/uploadthing";

interface BookActionsProps {
    book?: {
        id: string;
        title: string;
        author: string;
        description: string | null;
        category: { name: string } | string | null;
        language: string;
        type: string;
        content: string | null;
    };
    bookToEdit?: any; // Для сумісності, якщо десь передається як bookToEdit
}

export default function BookActions(props: BookActionsProps) {
    // Нормалізація пропсів (щоб працювало і як меню, і як кнопка створення)
    const book = props.book || props.bookToEdit;
    const isEditMode = !!book;

    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Отримуємо назву категорії безпечно
    const categoryName = book && (typeof book.category === 'object' && book.category !== null
        ? book.category.name
        : (book.category as string) || "Unsorted");

    const handleDelete = async () => {
        if (!confirm("Ви впевнені?")) return;
        setIsLoading(true);
        await deleteBook(book.id);
        setIsLoading(false);
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        try {
            if (isEditMode) {
                await editBook(formData);
                setIsEditOpen(false);
            } else {
                await createBook(formData);
                setIsOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert("Помилка при збереженні");
        } finally {
            setIsLoading(false);
        }
    };

    // ----- РЕНДЕР: МЕНЮ ДЛЯ ІСНУЮЧОЇ КНИГИ -----
    if (isEditMode) {
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
                            <Edit className="mr-2 h-4 w-4" /> Редагувати
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" /> Видалити
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Модальне вікно редагування */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Редагувати книгу</DialogTitle>
                        </DialogHeader>
                        <BookForm
                            isEditMode={true}
                            book={book}
                            categoryName={categoryName}
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                        />
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ----- РЕНДЕР: КНОПКА "ДОДАТИ" (ДЛЯ НОВОЇ КНИГИ) -----
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Додати книгу
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Завантажити нову книгу</DialogTitle>
                    <DialogDescription>
                        Завантажте файл або створіть текстовий запис.
                    </DialogDescription>
                </DialogHeader>
                <BookForm
                    isEditMode={false}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}

// --- ОКРЕМИЙ КОМПОНЕНТ ФОРМИ (ЩОБ НЕ ДУБЛЮВАТИ КОД) ---
function BookForm({ isEditMode, book, categoryName, onSubmit, isLoading }: any) {
    // Якщо ми редагуємо ТЕКСТОВУ нотатку -> показуємо поле контенту
    const showContentField = isEditMode && book.type === 'TEXT';

    return (
        <form action={onSubmit} className="space-y-4 py-2">
            {isEditMode && <input type="hidden" name="id" value={book.id} />}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium">Назва</Label>
                    <Input name="title" defaultValue={book?.title} required placeholder="Назва..." />
                </div>
                <div>
                    <Label className="text-sm font-medium">Автор</Label>
                    <Input name="author" defaultValue={book?.author} placeholder="Автор..." />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm font-medium">Категорія</Label>
                    <Select name="category" defaultValue={categoryName || "Unsorted"}>
                        <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Book">Книга</SelectItem>
                            <SelectItem value="Fanfic">Фанфік</SelectItem>
                            <SelectItem value="Study">Навчання</SelectItem>
                            <SelectItem value="Docs">Документи</SelectItem>
                            <SelectItem value="Unsorted">Інше</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-sm font-medium">Мова</Label>
                    <Select name="language" defaultValue={book?.language || "uk"}>
                        <SelectTrigger><SelectValue placeholder="Мова" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="uk">Українська</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="other">Інша</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Поле для тексту (Тільки при редагуванні нотатки) */}
            {showContentField && (
                <div>
                    <Label className="text-sm font-medium text-blue-600">Вміст тексту</Label>
                    <Textarea
                        name="content"
                        defaultValue={book.content || ""}
                        className="h-48 font-mono text-sm"
                    />
                </div>
            )}

            <div>
                <Label className="text-sm font-medium">Опис</Label>
                <Textarea
                    name="description"
                    defaultValue={book?.description || ""}
                    placeholder="#теги..."
                    className="h-20 w-full resize-none overflow-y-auto break-all"
                />
            </div>

            {/* 🔥 ЗОНА ЗАВАНТАЖЕННЯ (ТІЛЬКИ ДЛЯ НОВОЇ КНИГИ) */}
            {!isEditMode && (
                <div className="border-2 border-dashed rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-center">
                    <p className="text-sm text-slate-500 mb-2">Файл (PDF, EPUB, Картинка) або нічого для Нотатки</p>

                    {/* 👇 ВИКОРИСТОВУЄМО UploadButton ДЛЯ КОМПАКТНОСТІ */}
                    <UploadButton
                        endpoint="bookAttachment"
                        appearance={{
                            button: "bg-slate-900 text-white text-sm h-9 px-4 rounded-md hover:bg-slate-800",
                            allowedContent: "hidden" // Ховаємо текст "Image, PDF..."
                        }}
                        onClientUploadComplete={(res) => {
                            const file = res[0];
                            // Автозаповнення
                            const setVal = (name: string, val: string) => {
                                const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
                                if (el) el.value = val;
                            };

                            setVal("fileUrl", file.url);
                            setVal("fileKey", file.key);
                            setVal("size", file.size.toString());
                            setVal("fileName", file.name); // Важливо для визначення типу

                            // Якщо назва пуста - беремо з файлу
                            const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
                            if (titleInput && !titleInput.value) {
                                titleInput.value = file.name.replace(/\.[^/.]+$/, "");
                            }
                            alert(`✅ Файл "${file.name}" завантажено!`);
                        }}
                        onUploadError={(e) => alert(`Помилка: ${e.message}`)}
                    />

                    {/* Приховані поля */}
                    <input type="hidden" name="fileUrl" />
                    <input type="hidden" name="fileKey" />
                    <input type="hidden" name="size" />
                    <input type="hidden" name="fileName" />
                    <input type="hidden" name="mode" value="file" />
                    {/* Якщо файлу не буде, сервер зрозуміє, що це текстова нотатка */}
                </div>
            )}

            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    <>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditMode ? "Зберегти зміни" : "Створити"}
                    </>
                </Button>
            </DialogFooter>
        </form>
    );
}