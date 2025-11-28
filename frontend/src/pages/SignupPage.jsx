import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SignupPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const roleFromQuery = searchParams.get('role') || 'student';

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: roleFromQuery,
		department: 'CS'
	});

	// Update form data when role from query changes
	useEffect(() => {
		console.log('Role from query:', roleFromQuery); // Debug log
		setFormData(prev => ({ 
			...prev, 
			role: roleFromQuery 
		}));
	}, [roleFromQuery]);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const departments = ['CS', 'IT', 'ECE', 'Mechanical', 'Civil', 'Electrical'];

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess('');

		// Validation
		if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
			setError('All fields are required');
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError('Please enter a valid email address (e.g., john@gmail.com)');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters long');
			return;
		}

		try {
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			console.log('Signing up with role:', formData.role); // Debug log
			const res = await fetch(`${apiUrl}/api/auth/signup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					password: formData.password,
					role: formData.role,
					department: formData.department
				})
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Signup failed');
			}

			setSuccess('Account created successfully! Redirecting to login...');
			setTimeout(() => {
				if (formData.role === 'admin') {
					navigate('/admin-login');
				} else {
					navigate('/login');
				}
			}, 2000);
		} catch (err) {
			console.error('Signup error:', err);
			if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
				setError('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
			} else if (err.message.includes('already registered')) {
				setError('This email is already registered. Please use a different email or login.');
			} else {
				setError(err.message || 'Signup failed. Please check your information and try again.');
			}
		}
	}

	return (
		<div className="grid" style={{ marginTop: 24 }}>
			<div className="card panel" style={{ gridColumn: 'span 12', maxWidth: 520, margin: '0 auto' }}>
				<div className="section-title">Create Account</div>
				<div className="spacer" />

				<form onSubmit={handleSubmit}>
					<input
						className="input"
						placeholder="Full Name"
						name="name"
						value={formData.name}
						onChange={handleChange}
					/>
					<div className="spacer" />

					<input
						className="input"
						placeholder="Email Address (e.g., john@gmail.com)"
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
					/>
					<div className="spacer" />

					<div style={{ position: 'relative', marginBottom: 12 }}>
						<input
							className="input"
							placeholder="Password (min 6 characters)"
							type={showPassword ? 'text' : 'password'}
							name="password"
							value={formData.password}
							onChange={handleChange}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							style={{
								position: 'absolute',
								right: 12,
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								fontSize: 18,
								padding: 4
							}}
						>
							{showPassword ? '👁️' : '👁️‍🗨️'}
						</button>
					</div>
					<div className="spacer" />

					<div style={{ position: 'relative', marginBottom: 12 }}>
						<input
							className="input"
							placeholder="Confirm Password"
							type={showConfirmPassword ? 'text' : 'password'}
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							style={{
								position: 'absolute',
								right: 12,
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								fontSize: 18,
								padding: 4
							}}
						>
							{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
						</button>
					</div>

				<div className="spacer" />

				{/* Role Display */}
				<div style={{ 
					padding: '12px 16px', 
					backgroundColor: '#f3f4f6', 
					borderRadius: '8px', 
					marginBottom: '16px',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center'
				}}>
					<span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
						Registering as:
					</span>
					<span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
						{formData.role === 'admin' ? '👨‍💼 Admin' : formData.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
					</span>
				</div>

				{/* Department Selection */}
				<div>
					<label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
						Department
					</label>
					<select
						className="input"
						name="department"
						value={formData.department}
						onChange={handleChange}
						style={{ marginBottom: '16px' }}
					>
						{departments.map(dept => (
							<option key={dept} value={dept}>{dept}</option>
						))}
					</select>
				</div>

				<button className="btn primary" type="submit">Create Account</button>

					{error && (
						<div className="muted" style={{ marginTop: 12, color: '#d32f2f', fontWeight: 500 }}>
							{error}
						</div>
					)}

					{success && (
						<div className="muted" style={{ marginTop: 12, color: '#388e3c', fontWeight: 500 }}>
							{success}
						</div>
					)}

					<div className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
						Already have an account?{' '}
						<a href={formData.role === 'admin' ? '/admin-login' : '/login'} style={{ color: '#1976d2', textDecoration: 'none' }}>Login here</a>
					</div>
				</form>
			</div>
		</div>
	);
}
