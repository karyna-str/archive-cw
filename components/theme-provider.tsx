"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"


export function ThemeProvider({ children, ...props }: NextThemesProvider) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}