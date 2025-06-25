import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Corrected import path

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from AuthContext

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) { // Check if the response status is 200-299
        alert("Login successful!");
        console.log("Login successful:", data);
        // Call the login function from context to update global state
        login(data.user, data.token);
        navigate('/'); // Redirect to home page
      } else {
        alert(`Login failed: ${data.msg || 'Unknown error'}`);
        console.error("Login error:", data);
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      alert("An error occurred during login. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#73aeb7] to-[#652a37] text-white font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-black bg-opacity-70 p-10 rounded-lg shadow-2xl border border-pink-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            LOGIN
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              LOGIN
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-300">
            Don't have an account? {' '}
            <Link to="/SignupPage" className="font-medium text-pink-600 hover:text-pink-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;