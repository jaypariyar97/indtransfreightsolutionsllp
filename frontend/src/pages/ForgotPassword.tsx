import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../services/api';
import { notify, notifyFormErrors } from '../services/notify';
import { Mail, ArrowLeft } from 'lucide-react';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
    } catch {
      notify('Could not send reset link, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-7">
          <div className="flex flex-col items-center mb-5">
            <img src="/logo.jpeg" alt="INDTRANS" className="h-12 mb-3" />
            <h1 className="text-lg font-black text-gray-900 tracking-widest uppercase text-center">
              INDTRANS FREIGHT SOLUTIONS LLP 
              {/* <span className="text-orange-600">LLP</span> */}
            </h1>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot your password?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter the email associated with your account and we'll send you a reset link.
          </p>

          {submitted ? (
            <div className="space-y-4" data-testid="forgot-success">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                If that email is registered with us, a reset link is on its way. The link is
                valid for 60 minutes and can be used only once.
              </div>
              <Link
                to="/admin/login"
                className="block text-center w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit, (errs) => notifyFormErrors(errs as any))}
              className="space-y-4"
              data-testid="forgot-password-form"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="you@example.com"
                    data-testid="forgot-email-input"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-60"
                data-testid="forgot-password-submit"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
