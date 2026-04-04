'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:5000/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('OTP sent to your email!');
        // Store email for OTP verification
        localStorage.setItem('resetEmail', email);
        router.push('/otp');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-lg mb-4 md:mb-6">
            <img 
              src="/Logo.jpg" 
              alt="Gupta Distributors Logo" 
              className="h-10 md:h-12 w-auto"
            />
          </div>
        </div>

        {/* Back to Login */}
        <div className="mb-4 md:mb-6">
          <Link 
            href="/login" 
            className="inline-flex items-center text-xs md:text-sm text-gray-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Forgot Password Form */}
        <div className="card shadow-xl">
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Forgot Password?</h1>
            <p className="text-gray-600 text-xs md:text-sm">
              No worries! Enter your email address and we'll send you an OTP to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 md:py-3 text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                  Sending OTP...
                </div>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Gupta Distributors Admin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 