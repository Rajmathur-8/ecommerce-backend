'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const email = localStorage.getItem('resetEmail');
      if (!email) {
        toast.error('Email not found. Please try again.');
        router.push('/forgot-password');
        return;
      }

      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:5000/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('OTP verified successfully!');
        // Store reset token for password reset
        localStorage.setItem('resetToken', data.resetToken);
        router.push('/reset-password');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Invalid OTP');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    try {
      const email = localStorage.getItem('resetEmail');
      if (!email) {
        toast.error('Email not found. Please try again.');
        router.push('/forgot-password');
        return;
      }

      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:5000/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('OTP resent successfully!');
        setCountdown(60); // 60 seconds countdown
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
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

        {/* Back to Forgot Password */}
        <div className="mb-4 md:mb-6">
          <Link 
            href="/forgot-password" 
            className="inline-flex items-center text-xs md:text-sm text-gray-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Back
          </Link>
        </div>

        {/* OTP Verification Form */}
        <div className="card shadow-xl">
          <div className="mb-6 md:mb-8">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                <Key className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2 text-center">Verify OTP</h1>
            <p className="text-gray-600 text-center text-xs md:text-sm">
              We've sent a 6-digit code to your email. Please enter it below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* OTP Input Fields */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-3 md:mb-4 text-center">
                Enter 6-digit OTP
              </label>
              <div className="flex justify-center gap-1.5 md:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-white"
                    placeholder="0"
                  />
                ))}
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
                  Verifying...
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                className="text-xs md:text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 h-3 md:h-4 md:w-4 border-b-2 border-primary-600 mr-1 md:mr-2"></div>
                    Sending...
                  </div>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend OTP'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 md:mt-6">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Gupta Distributors Admin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 