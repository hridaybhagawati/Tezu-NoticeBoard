import { authHeader } from './auth.js';

const BASE = '/api';

export async function apiGet(path, params) {
	const url = new URL(BASE + path, window.location.origin);
	if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
	const res = await fetch(url.toString(), { headers: { ...authHeader() } });
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function apiPost(path, body) {
	const res = await fetch(BASE + path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function apiPut(path, body) {
	const res = await fetch(BASE + path, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify(body)
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function apiDelete(path) {
	const res = await fetch(BASE + path, {
		method: 'DELETE',
		headers: { ...authHeader() }
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export async function apiPostFormData(path, formData) {
	const res = await fetch(BASE + path, {
		method: 'POST',
		headers: { ...authHeader() },
		body: formData
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}


