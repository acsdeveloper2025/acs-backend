import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const SimpleDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          🏢 ACS Dashboard
        </h1>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Welcome, <strong>{user?.name || user?.username || 'User'}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Welcome Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            🎉 Welcome to the CRM Dashboard!
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            You have successfully logged in to the ACS CRM Admin Dashboard. 
            The authentication system is now fully functional and connected to the backend.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #e0f2fe'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '0.5rem'
              }}>
                ✅ Authentication
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#075985'
              }}>
                Login/logout system working
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #dcfce7'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#166534',
                marginBottom: '0.5rem'
              }}>
                🔐 Protected Routes
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#15803d'
              }}>
                Route protection active
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fefce8',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fef3c7'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#a16207',
                marginBottom: '0.5rem'
              }}>
                🚀 Ready for Features
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#ca8a04'
              }}>
                Ready to add more pages
              </p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        {user && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              👤 User Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Name
                </label>
                <p style={{
                  fontSize: '1rem',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {user.name || 'N/A'}
                </p>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Username
                </label>
                <p style={{
                  fontSize: '1rem',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {user.username || 'N/A'}
                </p>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Role
                </label>
                <p style={{
                  fontSize: '1rem',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {user.role || 'N/A'}
                </p>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Email
                </label>
                <p style={{
                  fontSize: '1rem',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {user.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
