"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export function Sort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get("sort") || "newest";

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);

        router.push(`/?${params.toString()}`);
    };

    return (
        <Select defaultValue={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Найновіші</SelectItem>
                <SelectItem value="oldest">Найстаріші</SelectItem>
                <SelectItem value="title_asc">А-Я (A-Z)</SelectItem>
                <SelectItem value="title_desc">Я-А (Z-A)</SelectItem>
            </SelectContent>
        </Select>
    );
}