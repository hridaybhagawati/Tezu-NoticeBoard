export function storeAuth(data) {
    try {
        if (!data || !data.token || !data.user) {
            console.error('Invalid auth data:', data);
            return false;
        }

        // Store the new auth data
        localStorage.setItem('auth', JSON.stringify(data));
        
        // Verify the data was stored correctly
        const stored = localStorage.getItem('auth');
        if (!stored) {
            console.error('Failed to verify stored auth data');
            return false;
        }

        console.log('Auth data stored successfully for user:', data.user.id);
        return true;
    } catch (err) {
        console.error('Error storing auth:', err);
        return false;
    }
}

export function getStoredAuth() {
    try {
        const s = localStorage.getItem('auth');
        if (!s) return null;
        
        const data = JSON.parse(s);
        if (!data || !data.token || !data.user) {
            console.warn('Invalid stored auth data:', data);
            localStorage.removeItem('auth');
            return null;
        }
        return data;
    } catch (err) {
        console.error('Error reading auth:', err);
        localStorage.removeItem('auth');
        return null;
    }
}

export function clearAuth() {
    try {
        localStorage.removeItem('auth');
        return true;
    } catch (err) {
        console.error('Error clearing auth:', err);
        return false;
    }
}

export function authHeader() {
    try {
        const a = getStoredAuth();
        const header = a?.token ? { Authorization: `Bearer ${a.token}` } : {};
        if (!a?.token) {
            console.warn('No token in auth data');
        } else {
            console.log('Auth header created with token:', a.token.substring(0, 20) + '...');
        }
        return header;
    } catch (err) {
        console.error('Error getting auth header:', err);
        return {};
    }
}


