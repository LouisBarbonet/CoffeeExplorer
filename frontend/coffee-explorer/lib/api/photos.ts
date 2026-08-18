import { apiFetch } from "@/lib/api-client";

export async function uploadPhoto(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ url: string }>("/photos", {
        method: "POST",
        body: formData,
    });
}