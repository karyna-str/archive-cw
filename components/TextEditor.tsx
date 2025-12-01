"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X, Loader2 } from "lucide-react";
import { saveTextContent } from "@/app/actions";
import { useRouter } from "next/navigation";

interface TextEditorProps {
    bookId: string;
    initialContent: string;
}

export default function TextEditor({ bookId, initialContent }: TextEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveTextContent(bookId, text);
            setIsEditing(false);
            router.refresh(); // Оновлюємо сторінку, щоб побачити зміни
        } catch (error) {
            alert("Помилка при збереженні");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setText(initialContent); // Скидаємо зміни
        setIsEditing(false);
    };

    return (
        <div className="relative">
            {/* ПАНЕЛЬ ІНСТРУМЕНТІВ (Кнопка редагування) */}
            <div className="absolute -top-14 right-0 flex gap-2">
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                        <Edit size={16} /> Редагувати текст
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleCancel} variant="ghost" disabled={isSaving}>
                            <X size={16} className="mr-2" /> Скасувати
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Зберегти
                        </Button>
                    </>
                )}
            </div>

            {/* ЗОНА КОНТЕНТУ */}
            <div className="bg-card p-6 md:p-10 rounded-lg shadow-sm border min-h-[60vh]">
                {isEditing ? (
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[60vh] w-full resize-y border-0 focus-visible:ring-0 p-0 text-lg font-serif leading-relaxed"
                        placeholder="Почніть писати..."
                    />
                ) : (
                    <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-card-foreground break-words">
                        {text || <span className="text-gray-400 italic">Текст відсутній...</span>}
                    </div>
                )}
            </div>
        </div>
    );
}