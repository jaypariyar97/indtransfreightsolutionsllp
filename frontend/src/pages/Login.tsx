import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { notifyFormErrors } from '../services/notify';
import { ArrowLeft } from 'lucide-react';

// Schema for validation
const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  role: yup.string().required('Please select a role'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  // Where to land after a successful login (set by PrivateRoute when it bounces
  // an unauthenticated user). Falls back to /dashboard.
  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/dashboard';
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: 'admin' }
  });

  // Watch the role field to update the button text dynamically
  const selectedRole = watch("role");

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password, data.role);
      // Force password change on first login
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      if (u?.mustChangePassword) {
        navigate('/admin/change-password', { replace: true });
      } else {
        // Honour the original deep link the guard captured (PrivateRoute → state.from)
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Back Button - Top Left */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition font-semibold px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </button>

      <div className="w-full max-w-md">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.jpeg" alt="INDTRANS" className="h-12" />
            <div className="leading-none">
              <h1 className="text-2xl font-black text-gray-800 tracking-widest uppercase">
                INDTRANS FREIGHT SOLUTIONS LLP 
                {/* <span className="text-orange-600">LLP</span> */}
              </h1>
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wide">Transport Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
          <p className="text-gray-500 mb-6 text-sm">Sign in to access the dashboard</p>

          <form onSubmit={handleSubmit(onSubmit, (errs) => notifyFormErrors(errs as any))} className="space-y-4">
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login As</label>
              <select 
                {...register('role')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>

            {/* Username/Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <input 
                  type="email" 
                  {...register('email')} 
                  placeholder="e.g. operations@indtrans..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  {...register('password')} 
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                to="/admin/forgot-password"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            {/* DYNAMIC BUTTON TEXT */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In as</span>
                  {/* This part updates dynamically */}
                  <span className="font-bold">
  		{selectedRole.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '')}
		</span>

                </>
              )}
            </button>
          </form>

          {/* Login Reference Box */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
            {/* <p className="font-semibold text-gray-800 mb-1">LOGIN REFERENCE</p>
            <p><span className="font-medium">Admin:</span> operations@indtransfreightsolutions.com</p>
            <p><span className="font-medium">Password:</span> Indtrans 1234</p> */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              Employee accounts are created by the admin in the User Management section.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}