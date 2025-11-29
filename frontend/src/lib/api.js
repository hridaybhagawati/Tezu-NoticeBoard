import { authHeader } from './auth.js';

// Automatically detect backend:
const API_BASE =
    import.meta.env.VITE_API_URL        // Production backend URL (Render)
    || (import.meta.env.DEV ? '' : '')  // During local dev, use proxy
    || '/api';                          // Fallback

export async function apiGet(path, params) {
    const url = new URL(API_BASE + path, window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
            url.searchParams.set(k, v);
        }
    });

    const res = await fetch(url.toString(), { headers: { ...authHeader() } });
    if (!res.ok) throw new Error(await safeError(res));
    return res.json();
}

export async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await safeError(res));
    return res.json();
}

export async function apiPut(path, body) {
    const res = await fetch(API_BASE + path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await safeError(res));
    return res.json();
}

export async function apiDelete(path) {
    const res = await fetch(API_BASE + path, {
        method: 'DELETE',
        headers: { ...authHeader() }
    });
    if (!res.ok) throw new Error(await safeError(res));
    return res.json();
}

export async function apiPostFormData(path, formData) {
    const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { ...authHeader() },
        body: formData
    });
    if (!res.ok) throw new Error(await safeError(res));
    return res.json();
}

// Helper to extract backend error
async function safeError(res) {
    try {
        const json = await res.json();
        return json.error || json.message || res.statusText;
    } catch {
        return res.statusText;
    }
}
