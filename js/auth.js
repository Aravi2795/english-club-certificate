/**
 * Communication Club - Authentication & Google Identity Services Engine
 */

class AuthManager {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.adminSession = this.loadAdminSession();
  }

  loadCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem('comm_club_user_session')) || null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      sessionStorage.setItem('comm_club_user_session', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('comm_club_user_session');
    }
    window.dispatchEvent(new CustomEvent('comm_club_auth_changed', { detail: user }));
  }

  // Parse JWT token from Google Identity Services
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse Google JWT:', e);
      return null;
    }
  }

  // Handle Google OAuth Credential response
  handleGoogleCredential(response) {
    if (!response || !response.credential) return;
    const payload = this.parseJwt(response.credential);
    if (!payload) return;

    const user = {
      name: payload.name || payload.given_name || 'Participant',
      email: payload.email,
      picture: payload.picture || '',
      provider: 'google'
    };

    this.setCurrentUser(user);
    return user;
  }

  // Quick Demo Google Login
  loginWithDemo(email, name = '') {
    const user = {
      name: name || (email.split('@')[0].replace(/\./g, ' ').toUpperCase()),
      email: email.trim().toLowerCase(),
      picture: '',
      provider: 'demo_google'
    };
    this.setCurrentUser(user);
    return user;
  }

  logout() {
    this.setCurrentUser(null);
  }

  // Admin Authentication
  loadAdminSession() {
    return sessionStorage.getItem('comm_club_admin_auth') === 'true';
  }

  loginAdmin(username, password) {
    // Default admin credentials (customizable in settings)
    if ((username === 'admin' || username === 'coordinator') && password === 'admin123') {
      sessionStorage.setItem('comm_club_admin_auth', 'true');
      this.adminSession = true;
      return true;
    }
    return false;
  }

  logoutAdmin() {
    sessionStorage.removeItem('comm_club_admin_auth');
    this.adminSession = false;
  }

  isAdminLoggedIn() {
    return sessionStorage.getItem('comm_club_admin_auth') === 'true';
  }
}

window.authManager = new AuthManager();
