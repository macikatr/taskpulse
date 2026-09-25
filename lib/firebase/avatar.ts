"use client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

const ALLOWED = new Set(["image/png","image/jpeg","image/webp","image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function defaultAvatarUrl(fullName: string, email?: string) {
    const label = (fullName || email || "avatar").split("@")[0].trim().replace(/\s+/g,"");
    return `https://avatar.vercel.sh/${encodeURIComponent(label)}`;
}

export async function uploadAvatar(file: File, kind: "users"|"workspaces", id: string) {
    if (!ALLOWED.has(file.type)) throw new Error("Only PNG/JPEG/WebP/GIF allowed");
    if (file.size > MAX_BYTES) throw new Error("Max 5MB");
    const ext = file.type.split("/")[1].replace("jpeg","jpg");
    const path = `avatars/${kind}/${id}/main.${ext}`;
    const snapshot = await uploadBytes(ref(storage, path), file);
    const url = await getDownloadURL(snapshot.ref);
    return { path, url };
}

