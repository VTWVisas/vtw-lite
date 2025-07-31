'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'


export async function signUp(_: unknown, formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      }
    }
  })

  console.log("🔁 Attempting to create user...", { email, name })

  if (error) {
    console.error("❌ Failed to create user:", error.message);
    return {
      errors: [error.message],
      payload: null
    };
  }

  if (!data.user?.app_metadata?.email_verified) {
    console.warn("⚠️ Email not verified. Redirecting to verify email...");
    return {
      errors: ['Please verify your email address before signing in.'],
      payload: null
    };
  }

  console.log("✅ User created successfully. Redirecting to dashboard...", data);
  return {
    payload: data,
    errors: []
    // redirect('/dashboard')
  }

}