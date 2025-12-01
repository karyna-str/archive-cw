"use client";

import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function Search() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [term, setTerm] = useState(searchParams.get("q")?.toString() || "");

    const handleSearch = (term: string) => {
        setTerm(term);

        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }

        replace(`/?${params.toString()}`);
    };

    return (
        <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
                placeholder="Пошук по назві, автору або тегам..."
                className="pl-10 bg-slate-50/50"
                value={term}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    );
}