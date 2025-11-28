import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function requireAuth(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded;
		return next();
	} catch {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

export function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
		if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
		next();
	};
}


