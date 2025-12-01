"use server";

import { db } from "@/lib/db"
import {auth, currentUser} from "@clerk/nextjs/server"
import {revalidatePath} from "next/cache";

function countWords(text: string) {
    if (!text) return 0;
    // Якщо є ієрогліфи (CJK) - рахуємо символи
    const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
    if (hasCJK) return text.replace(/\s/g, '').length;
    // Інакше рахуємо по пробілах
    return text.trim().split(/\s+/).length;
}
export async function createBook(formData: FormData) {
    const {userId} = await auth();

    if (!userId) {
        throw new Error("Не авторизовано")
    }

    const mode = formData.get("mode") as string;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const language = formData.get("language") as string;
    const category = formData.get("category") as string;
    const fileUrl = formData.get("fileUrl") as string;
    const fileKey = formData.get("fileKey") as string;
    const fileName = (formData.get("fileName") as string) || "";
    const size = formData.get("size") ? Number(formData.get("size")) : 0;

    const content = formData.get("content") as string;

    let type = "TEXT";
    let finalWordCount = 0;

    if (mode === "text") {
        // Якщо це ручний ввід тексту
        type = "TEXT";
        finalWordCount = countWords(content);
    } else {
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith(".pdf")) {
            type = "PDF";
        } else if (lowerName.endsWith(".epub")) {
            type = "EPUB";
        } else if (lowerName.match(/\.(jpg|jpeg|png|webp)$/)) {
            type = "IMAGE";
        } else type = "TEXT";

        if (type === "TEXT" && fileUrl) {
            try {
                const response = await fetch(fileUrl);
                const textFromFile = await response.text();
                finalWordCount = countWords(textFromFile);
            } catch (error) {
                console.error("Не вдалося порахувати слова у файлі:", error);
            }
        }
    }

    if (!title) {
        throw new Error("Назва книги обов'язкова");
    }

    await db.book.create({
        data: {
            userId,
            title,
            author: author || (mode === "text" ? "Я" : "Невідомий"),
            description,
            language: language || "ukr",
            category: category || "Unsorted",
            fileUrl: mode === "file" ? fileUrl : null,
            fileKey: mode === "file" ? fileUrl : null,
            content: mode === "text" ? content : null,
            type: type,
            size: mode === "file" ? size : null,
            wordCount: finalWordCount,
        },
    });
    revalidatePath("/");

}

export async function deleteBook(bookId: string) {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId|| !user) throw new Error("Unauthorized");

    const isAdmin = user.publicMetadata?.role === "admin";

    if (isAdmin) {
        await db.book.delete({
            where: {
                id: bookId,
            },
        });
    } else {
    // Видаляємо книгу, але ТІЛЬКИ якщо вона належить цьому юзеру
    await db.book.deleteMany({
        where: {
            id: bookId,
            userId: userId, // Захист: не можна видалити чуже
        },
    });
    }
    revalidatePath("/");
    revalidatePath("/admin");
}

export async function editBook(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const bookId = formData.get("id") as string;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const language = formData.get("language") as string;
    const content = formData.get("content") as string;

    let wordCount = undefined;
    if (content) {
        wordCount = countWords(content);
    }

    await db.book.updateMany({
        where: {
            id: bookId,
            userId: userId,
        },
        data: {
            title,
            author,
            description,
            language,
            category,
            content,
            ...(wordCount !== undefined && { wordCount }),
        },
    });

    revalidatePath("/");
    revalidatePath(`/read/${bookId}`);
}

export async function saveTextContent(bookId: string, content: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Перераховуємо слова
    const wordCount = countWords(content);

    await db.book.updateMany({
        where: {
            id: bookId,
            userId: userId,
        },
        data: {
            content: content,
            wordCount: wordCount,
        },
    });
    revalidatePath(`/read/${bookId}`);
}