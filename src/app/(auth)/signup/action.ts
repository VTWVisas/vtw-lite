'use server'

import { createClient } from '@/lib/supabase/server'


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

  if (data.user?.user_metadata?.email_verified === false) {
    console.log("✅ User created successfully. Please verify your email.", data);

    return {
      errors: [],
      payload: "User created successfully. Please verify your email."
    };
  }

  console.warn("⚠️  User already exists, redirecting to sign in page...", data);
  return {
    payload: null,
    errors: ["Account exists, please sign in."],
  }
}