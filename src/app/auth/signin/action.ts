"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(_: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })


    if (error) {
        console.error("❌ Failed to sign in:", error.message);
        // redirect('/auth/signin?error=Invalid credentials')
        return {
            payload: '',
            errors: [error.message]
        };
    }

    console.log("✅ User signed in successfully. Redirecting to dashboard...");
    redirect('/dashboard')
}