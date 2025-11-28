import { authHeader } from './auth.js';

// Cache for blob URLs to avoid re-fetching
const fileCache = new Map();

export async function getSecureFileUrl(filename) {
	console.log('getSecureFileUrl called for:', filename);
	
	if (fileCache.has(filename)) {
		console.log('Using cached URL for:', filename);
		const url = fileCache.get(filename);
		console.log('Cached URL:', url);
		return url;
	}

	try {
		const headers = authHeader();
		console.log('Fetching file:', filename);
		console.log('Headers:', Object.keys(headers));
		console.log('Auth header value:', headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'NO AUTH HEADER');
		
		const url = `/api/notices/files/${filename}`;
		console.log('Request URL:', url);
		
		const res = await fetch(url, {
			headers,
			credentials: 'include'
		});

		console.log('Fetch response status:', res.status, res.statusText);
		console.log('Response headers:', Array.from(res.headers.entries()).slice(0, 5));

		if (!res.ok) {
			const text = await res.text();
			console.error(`Failed to fetch file ${filename}:`, res.status, res.statusText);
			console.error('Response body:', text);
			throw new Error(`Failed to fetch file: ${res.status} ${res.statusText} - ${text}`);
		}

		console.log('Response is ok, getting blob...');
		const blob = await res.blob();
		console.log('Got blob:', blob.type, blob.size, 'bytes');
		
		const blobUrl = URL.createObjectURL(blob);
		console.log('Created object URL:', blobUrl);
		
		fileCache.set(filename, blobUrl);
		return blobUrl;
	} catch (err) {
		console.error('Error fetching file:', filename, err);
		throw err;
	}
}

export async function downloadFile(filename, originalName) {
	try {
		const url = await getSecureFileUrl(filename);
		const a = document.createElement('a');
		a.href = url;
		a.download = originalName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} catch (err) {
		console.error('Download error:', err);
		alert('Failed to download file: ' + err.message);
	}
}

export async function downloadPDF(noticeId, noticeTitle) {
	try {
		console.log('Downloading PDF for notice:', noticeId);
		const headers = authHeader();
		
		const res = await fetch(`/api/notices/${noticeId}/export/pdf`, {
			headers,
			credentials: 'include'
		});

		if (!res.ok) {
			const text = await res.text();
			console.error(`Failed to download PDF:`, res.status, res.statusText);
			console.error('Response body:', text);
			throw new Error(`Failed to download PDF: ${res.status} ${res.statusText}`);
		}

		const blob = await res.blob();
		console.log('Got PDF blob:', blob.type, blob.size, 'bytes');
		
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${noticeTitle || 'notice'}-${noticeId}.pdf`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	} catch (err) {
		console.error('PDF download error:', err);
		alert('Failed to download PDF: ' + err.message);
	}
}
