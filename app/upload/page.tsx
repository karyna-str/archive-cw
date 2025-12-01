"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing"; // Твоя кнопка
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBook } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UploadPage() {
    const router = useRouter();

    const [fileUrl, setFileUrl] = useState<string>("");
    const [fileKey, setFileKey] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string>("");
    const [mode, setMode] = useState<"file" | "text">("file");

    async function onSubmit(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        formData.append("fileUrl", fileUrl);
        formData.append("fileKey", fileKey);
        formData.append("size", fileSize.toString());
        formData.append("fileName", fileName);
        formData.append("mode", mode);

        await createBook(formData as any);

        router.push("/");
    }

    return (
        <div className="flex justify-center items-center min-h-[90vh] p-4 py-10">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Додати нову книгу</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">

                        {/* ВКЛАДКИ: Файл або Текст */}
                        <Tabs defaultValue="file" onValueChange={(val) => setMode(val as "file" | "text")}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="file">Завантажити файл</TabsTrigger>
                                <TabsTrigger value="text">Написати текст</TabsTrigger>
                            </TabsList>

                            {/* Вкладка ФАЙЛ */}
                            <TabsContent value="file" className="mt-4 space-y-4">
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                                    {fileUrl ? (
                                        <div className="text-green-600 text-center">
                                            <p>Файл завантажено!</p>
                                            <p className="text-sm font-bold mt-1">{fileName}</p>
                                        </div>
                                    ) : (
                                        <UploadButton
                                            endpoint="bookAttachment"
                                            onUploadBegin={() => setIsUploading(true)}
                                            onClientUploadComplete={(res) => {
                                                const file = res?.[0] as any;
                                                if (file) {
                                                    setFileUrl(file.ufsUrl || file.url);
                                                    setFileKey(file.key);
                                                    setFileSize(file.size);
                                                    setFileName(file.name);
                                                    setIsUploading(false);
                                                }
                                            }}
                                            onUploadError={(error: Error) => {
                                                setIsUploading(false);
                                                alert(`Помилка: ${error.message}`);
                                            }}
                                        />
                                    )}
                                </div>
                            </TabsContent>

                            {/* Вкладка ТЕКСТ */}
                            <TabsContent value="text" className="mt-4">
                                <Textarea
                                    name="content"
                                    placeholder="Пишіть свій текст, есе або нотатки тут..."
                                    className="min-h-[200px]"
                                />
                            </TabsContent>
                        </Tabs>

                        {/* 1. Поле Назви */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Назва книги</label>
                            <Input name="title" placeholder="Назва" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Автор</label>
                                <Input name="author" placeholder="Автор" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Мова</label>
                                <Select name="language" defaultValue="uk">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Оберіть мову" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uk">Українська</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="ja">Japanese</SelectItem>
                                        <SelectItem value="other">Інша</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Категорія</label>
                                <Select name="category" defaultValue="Unsorted">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Тип" />
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
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Опис (Теги)</label>
                            <Textarea
                                name="description"
                                placeholder="#навчання #курсова #фантастика"
                                className="h-20 resize-none"
                            />
                        </div>

                        {/* 4. Кнопка Зберегти */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isUploading || (mode === "file" && !fileUrl)} // Блокуємо, поки не завантажать файл
                        >
                            Зберегти в бібліотеку
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}