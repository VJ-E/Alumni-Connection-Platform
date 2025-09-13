"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Simple sign out function that clears cache and redirects to sign-in
export async function signOut() {
  try {
    // Clear any cached data
    revalidatePath("/");
    
    // Redirect to sign-in page
    redirect("/sign-in");
  } catch (error) {
    console.error("Error signing out:", error);
    redirect("/sign-in");
  }
}

// Get current user ID
export async function getCurrentUserId() {
  try {
    const { userId } = auth();
    return { userId, error: null };
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return { userId: null, error: "Failed to get user ID" };
  }
}
