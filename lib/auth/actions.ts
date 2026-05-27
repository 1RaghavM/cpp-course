"use server";

import { isOwner } from "@/lib/auth/owner-only";

const NOT_OWNER_MESSAGE =
  "Access is restricted to the owner account for this deployment. Check OWNER_EMAIL in your environment.";

export type OwnerEmailValidation =
  | { ok: true }
  | { ok: false; message: string };

/** Server-side check before sign-up or sign-in attempts. */
export async function validateOwnerEmail(email: string): Promise<OwnerEmailValidation> {
  if (!process.env.OWNER_EMAIL?.trim()) {
    return { ok: false, message: "OWNER_EMAIL is not configured on the server." };
  }

  if (!isOwner(email)) {
    return { ok: false, message: NOT_OWNER_MESSAGE };
  }

  return { ok: true };
}
