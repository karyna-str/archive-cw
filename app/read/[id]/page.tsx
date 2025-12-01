import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download } from "lucide-react";
import TextEditor from "@/components/TextEditor"

interface ReadPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
    const { id } = await params;

    const book = await db.book.findUnique({
        where: { id },
    });

    if (!book) {
        return notFound();
    }

    // 1. Визначаємо тип файлу (всі перевірки в нижньому регістрі)
    const lowerUrl = book.fileUrl?.toLowerCase() || "";

    const isPdf = lowerUrl.includes('.pdf') || book.type === 'PDF';

    const isImage = book.fileUrl && (
        book.type === 'IMAGE' ||
        lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)$/)
    );

    let textContent = "";

    // 2. Завантажуємо текст ТІЛЬКИ якщо це не PDF і не Картинка
    if (book.content) {
        textContent = book.content;
    }
    else if (book.fileUrl && !isPdf && !isImage) {
        try {
            const response = await fetch(book.fileUrl);
            if (!response.ok) throw new Error("File fetch failed");
            textContent = await response.text();
        } catch (e) {
            textContent = "Помилка: Не вдалося завантажити вміст файлу.";
        }
    }

    // Якщо це PDF, підготуємо повідомлення (хоча користувач скоріше побачить кнопку)
    if (isPdf) {
        textContent = "Цей файл є PDF. Будь ласка, поверніться назад і натисніть 'Відкрити PDF'.";
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl px-4">
            <Link href="/">
                <Button variant="outline" className="mb-6">← Назад до бібліотеки</Button>
            </Link>

            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                <p className="text-xl text-gray-500">Автор: {book.author}</p>
            </div>

            {/* 🔥 ГОЛОВНА ЗМІНА: Логіка відображення */}

            {isImage ? (
                // ВАРІАНТ А: ЯКЩО ЦЕ КАРТИНКА -> Показуємо <img>
                <div className="flex justify-center bg-muted/20 p-4 rounded-lg border min-h-[50vh] items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={book.fileUrl}
                        alt={book.title}
                        className="max-w-full h-auto max-h-[80vh] rounded shadow-md object-contain"
                    />
                </div>
            ) : isPdf ? (
                // ВАРІАНТ Б: ЯКЩО ЦЕ PDF -> Кнопка
                <div className="text-center py-20 bg-slate-50 rounded-lg border">
                    <p className="mb-6 text-gray-600 text-lg">PDF файли краще переглядати у повному вікні.</p>
                    <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="lg"><Download className="mr-2 h-5 w-5"/> Відкрити PDF у новій вкладці</Button>
                    </a>
                </div>
            ) : (
                // ВАРІАНТ В: ЯКЩО ЦЕ ТЕКСТ -> Показуємо текст
                <TextEditor bookId={book.id} initialContent={textContent} />
            )}
        </div>
    );
}