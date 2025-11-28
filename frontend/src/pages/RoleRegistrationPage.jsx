import { useNavigate } from 'react-router-dom';

const roleOptions = [
	{ 
		role: 'student', 
		emoji: '👨‍🎓', 
		label: 'Student',
		description: 'Access notices and campus updates',
		color: '#4f46e5'
	},
	{ 
		role: 'teacher', 
		emoji: '👨‍🏫', 
		label: 'Teacher',
		description: 'Create and manage notices',
		color: '#7c3aed'
	},
	{ 
		role: 'admin', 
		emoji: '👨‍💼', 
		label: 'Admin',
		description: 'Moderate and manage the platform',
		color: '#db2777'
	}
];

export default function RoleRegistrationPage() {
	const navigate = useNavigate();

	function goToSignup(role) {
		navigate(`/signup?role=${encodeURIComponent(role)}`);
	}

	return (
		<div style={{
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: '20px'
		}}>
			<style>{`
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				@keyframes hoverLift {
					0% {
						transform: translateY(0);
					}
					100% {
						transform: translateY(-8px);
					}
				}
				.role-btn {
					animation: slideUp 0.6s ease-out;
				}
				.role-btn:hover {
					animation: hoverLift 0.3s ease-out forwards;
				}
			`}</style>

			<div className="card" style={{ 
				maxWidth: 600, 
				width: '100%',
				backgroundColor: 'rgba(255, 255, 255, 0.98)',
				padding: '48px 32px',
				textAlign: 'center',
				backdropFilter: 'blur(10px)',
				border: '1px solid rgba(255, 255, 255, 0.2)'
			}}>
				<div style={{ marginBottom: 12 }}>
					<div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
					<h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: '0 0 8px 0' }}>Join Our Campus</h1>
					<p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>Select your role to create your account</p>
				</div>
				
				<div style={{ 
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
					gap: 16, 
					marginTop: 32,
					marginBottom: 32
				}}>
					{roleOptions.map((option, idx) => (
						<button
							key={option.role}
							className="role-btn"
							onClick={() => goToSignup(option.role)}
							style={{
								padding: '20px 16px',
								borderRadius: '16px',
								border: 'none',
								background: `linear-gradient(135deg, ${option.color}, ${option.color}dd)`,
								color: 'white',
								cursor: 'pointer',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '12px',
								boxShadow: `0 10px 30px ${option.color}30`,
								transition: 'all 0.3s ease',
								fontSize: 14,
								fontWeight: 600,
								animationDelay: `${idx * 0.1}s`
							}}
							onMouseEnter={(e) => {
								e.target.style.boxShadow = `0 20px 40px ${option.color}50`;
								e.target.style.transform = 'translateY(-8px)';
							}}
							onMouseLeave={(e) => {
								e.target.style.boxShadow = `0 10px 30px ${option.color}30`;
								e.target.style.transform = 'translateY(0)';
							}}
						>
							<span style={{ fontSize: 32 }}>{option.emoji}</span>
							<div>
								<div style={{ fontWeight: 700, fontSize: 16 }}>{option.label}</div>
								<div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{option.description}</div>
							</div>
						</button>
					))}
				</div>
				
				<div style={{ 
					borderTop: '1px solid #e5e7eb',
					paddingTop: 24,
					color: '#6b7280',
					fontSize: 14
				}}>
					Already have an account? <a href="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>Sign in here</a>
				</div>
			</div>
		</div>
	);
}
