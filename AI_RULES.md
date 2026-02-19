# AI Rules for ISAPM National Meeting Website

This document outlines the core technologies and best practices to follow when developing for this application.

## Tech Stack Overview

*   **Framework:** Next.js (App Router) for building the web application, handling routing, and server-side functionalities.
*   **Language:** TypeScript for all application code, ensuring type safety and improved developer experience.
*   **Styling:** Tailwind CSS for all styling, providing a utility-first approach for responsive and consistent designs.
*   **UI Components:** shadcn/ui components are used for a consistent and accessible user interface, built on Radix UI primitives.
*   **Database & Authentication:** Supabase is integrated for backend services, including user authentication and database management.
*   **Icons:** Lucide React provides a comprehensive set of customizable SVG icons.
*   **Form Management:** React Hook Form is used for efficient and flexible form handling, paired with Zod for schema validation.
*   **Date Utilities:** date-fns is utilized for all date manipulation and formatting tasks.
*   **Toast Notifications:** Sonner is the chosen library for displaying elegant and accessible toast notifications.
*   **Theme Management:** next-themes is used for managing dark/light mode functionality across the application.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following rules when using libraries:

*   **Next.js:**
    *   All pages and API routes must be created within the `app/` directory, following the Next.js App Router conventions.
    *   Client Components should be explicitly marked with `"use client"`.
*   **TypeScript:**
    *   All new code must be written in TypeScript.
    *   Ensure proper typing for all functions, components, and data structures.
*   **Tailwind CSS:**
    *   **Always** use Tailwind CSS classes for styling. Avoid inline styles or creating separate `.css` files for individual components.
    *   Prioritize utility classes for layout, spacing, colors, typography, and responsiveness.
*   **shadcn/ui & Radix UI:**
    *   **First choice for UI elements:** Always check if a suitable component exists in `components/ui/` (shadcn/ui).
    *   **Do not modify existing shadcn/ui files:** If a shadcn/ui component needs customization beyond its props, create a new component that wraps or extends it, or build a new component from scratch using Radix UI primitives and Tailwind CSS, following the existing `components/ui/` structure.
*   **Supabase:**
    *   Use the provided `lib/supabase/client.ts` for client-side Supabase interactions and `lib/supabase/server.ts` for server-side interactions (e.g., in API routes or server components).
    *   All authentication flows should leverage Supabase Auth.
*   **Lucide React:**
    *   Use `lucide-react` for all icons. Import specific icons as needed (e.g., `import { Mail, Phone } from 'lucide-react'`).
*   **React Hook Form & Zod:**
    *   For any forms requiring validation, use `react-hook-form` for state management and `zod` for defining validation schemas. Integrate them using `@hookform/resolvers`.
*   **date-fns:**
    *   Any operations involving dates (formatting, parsing, calculations) should use functions from `date-fns`.
*   **Sonner:**
    *   For displaying user feedback or notifications, use `sonner` toasts.
*   **next-themes:**
    *   Utilize the `ThemeProvider` from `next-themes` for managing and toggling between light and dark themes.
