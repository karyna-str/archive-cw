"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function countWords(text: string) {
    if (!text) return 0;
    const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
    if (hasCJK) {
        return text.replace(/\s/g, '').length;
    }
    return text.trim().split(/\s+/).length;
}

export async function createBook(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const mode = formData.get("mode") as string;
    const title = formData.get("title") as string;
    const categoryInput = (formData.get("category") as string) || "Інше";
    const authorInput = (formData.get("author") as string) || "Невідомий";
    const description = formData.get("description") as string;
    const language = (formData.get("language") as string) || "ukr";

    let fileUrl: string | null = null;
    let fileKey: string | null = null;
    let size: number | null = null;
    let content: string | null = null;
    let type = "TEXT";
    let wordCount = 0;

    if (mode === "file") {
        fileUrl = formData.get("fileUrl") as string;
        fileKey = formData.get("fileKey") as string;
        size = Number(formData.get("size"));

        const fileName = (formData.get("fileName") as string) || "";
        const lowerName = fileName.toLowerCase();

        if (lowerName.endsWith(".pdf")) type = "PDF";
        else if (lowerName.endsWith(".epub")) type = "EPUB";
        else if (lowerName.match(/\.(jpg|jpeg|png|webp)$/)) type = "IMAGE";
        else type = "TEXT";

        if (type === "TEXT" && fileUrl) {
            try {
                const response = await fetch(fileUrl);
                const textFromFile = await response.text();
                wordCount = countWords(textFromFile);
            } catch (e) {
                console.error("Error counting words from file", e);
            }
        }

    } else {
        content = formData.get("content") as string;
        type = "TEXT";
        wordCount = countWords(content);
    }

    await db.book.create({
        data: {
            userId: user.id,
            title,
            description,
            language,
            type,
            fileUrl,
            fileKey,
            size,
            content,
            wordCount,
            category: {
                connectOrCreate: {
                    where: { name: categoryInput },
                    create: { name: categoryInput },
                },
            },
            author: {
                connectOrCreate: {
                    where: { name: authorInput },
                    create: { name: authorInput },
                },
            },
        },
    });

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function editBook(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryInput = formData.get("category") as string;
    const authorInput = formData.get("author") as string;
    const language = formData.get("language") as string;

    const book = await db.book.findUnique({ where: { id } });
    if (!book) return;

    const isAdmin = (user.publicMetadata as { role?: string })?.role === "admin";
    if (book.userId !== user.id && !isAdmin) throw new Error("Forbidden");

    await db.book.update({
        where: { id },
        data: {
            title,
            description,
            language,
            category: {
                connectOrCreate: {
                    where: { name: categoryInput },
                    create: { name: categoryInput },
                },
            },
            author: {
                connectOrCreate: {
                    where: { name: authorInput },
                    create: { name: authorInput },
                },
            },
        },
    });

    revalidatePath("/");
    revalidatePath(`/read/${id}`);
    revalidatePath("/admin");
}

export async function deleteBook(bookId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book) return;

    const isAdmin = (user.publicMetadata as { role?: string })?.role === "admin";
    if (book.userId !== user.id && !isAdmin) throw new Error("Forbidden");

    if (book.fileKey) {
        await utapi.deleteFiles(book.fileKey);
    }

    await db.book.delete({ where: { id: bookId } });

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function saveTextContent(bookId: string, content: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book) return;

    const isAdmin = (user.publicMetadata as { role?: string })?.role === "admin";
    if (book.userId !== user.id && !isAdmin) throw new Error("Forbidden");

    const wordCount = countWords(content);

    await db.book.update({
        where: { id: bookId },
        data: {
            content: content,
            wordCount: wordCount,
        },
    });

    revalidatePath(`/read/${bookId}`);
    revalidatePath("/");
}