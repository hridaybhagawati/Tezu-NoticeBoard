import { useNavigate } from 'react-router-dom';

export default function RoleLoginPage() {
	const navigate = useNavigate();

	function goToLogin(role) {
		// navigate to login and pass selected role as query param
		navigate(`/student-teacher-login?role=${encodeURIComponent(role)}`);
	}

	return (
		<div style={{
			minHeight: '100vh',
			backgroundImage: 'url(/tezpur-campus.jpg)',
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			backgroundAttachment: 'fixed',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			backgroundBlendMode: 'darken',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: '20px'
		}}>
			<div className="card panel" style={{ maxWidth: 520, width: '100%', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
				<div className="section-title">Login</div>
				<div className="muted" style={{ marginBottom: 24, fontSize: 14 }}>Choose your role to continue</div>
				
				<div style={{ 
					display: 'flex', 
					flexDirection: 'column', 
					gap: 12, 
					marginTop: 16,
					padding: 20,
					border: '1px solid #ddd',
					borderRadius: '8px',
					backgroundColor: '#f9f9f9'
				}}>
					<div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#333' }}>Login as</div>
					<button 
						className="btn primary" 
						onClick={() => goToLogin('student')}
						style={{ width: '100%' }}
					>
						👨‍🎓 Student
					</button>
					<button 
						className="btn primary" 
						onClick={() => goToLogin('teacher')}
						style={{ width: '100%' }}
					>
						👨‍🏫 Teacher
					</button>
				</div>
				
				<div className="muted" style={{ marginTop: 20, fontSize: 13 }}>
					Don't have an account? You can <a href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>create one here</a>.
				</div>
			</div>
		</div>
	);
}
