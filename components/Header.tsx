"use client";
import Link from 'next/link';
import { BookOpen, Upload } from 'lucide-react'; // Імпортуємо іконки
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {Button} from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle";
import { useUser } from "@clerk/nextjs";
import { DonateButton } from "@/components/DonateButton";

export default function Header() {
    const { user, isLoaded } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';
    return (
        <header className="border-b border-border bg-background transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Логотип: посилання на головну */}
                    <Link href="/" className="flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <span className="font-bold text-xl text-foreground">Archive Hub</span>
                    </Link>

                    {/* Навігація */}
                    <div className="flex items-center gap-4">
                        <DonateButton />
                        <ModeToggle />
                        <SignedIn>
                            {isAdmin && (
                                <Link href="/admin">
                                    <Button variant="ghost" className="text-red-500 font-bold">
                                        Адміністративна панель
                                    </Button>
                                </Link>
                            )}
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>

                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button variant="outline">Увійти</Button>
                            </SignInButton>
                        </SignedOut>
                    </div>

                </div>
            </div>
        </header>
    );
}