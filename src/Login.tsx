import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', { email, password });
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1>SF Data Sync Pro</h1>
          <p>Login to your account</p>
        </div>
        <div className="header-buttons">
          <button className="btn btn-secondary" onClick={goBack}>Back</button>
        </div>
      </header>
      <main className="App-main">
        <div className="login-container">
          <h2>Welcome Back</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn login-btn">Login</button>
          </form>
          <p className="auth-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login