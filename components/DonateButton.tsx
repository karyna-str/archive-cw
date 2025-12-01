import Link from "next/link";
import { HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DonateButton() {
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_DONATE_LINK || "#";

    return (
        <Link href={stripeLink} target="_blank" rel="noopener noreferrer">
            <Button
                variant="outline"
                className="gap-2 border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-950 dark:border-pink-900 dark:text-pink-300 dark:hover:bg-pink-900 transition-colors"
            >
                <HandHeart size={16}/>
                <span className="hidden sm:inline">Підтримати</span>
            </Button>
        </Link>
    );
}