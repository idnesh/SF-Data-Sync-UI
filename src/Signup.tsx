import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle signup logic here
    console.log('Signup attempt:', { email, password, fullName });
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1>SF Data Sync Pro</h1>
          <p>Create your account</p>
        </div>
        <div className="header-buttons">
          <button className="btn btn-secondary" onClick={goBack}>Back</button>
        </div>
      </header>
      <main className="App-main">
        <div className="login-container">
          <h2>Get Started</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn login-btn">Sign Up</button>
          </form>
          <p className="auth-link">
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Signup