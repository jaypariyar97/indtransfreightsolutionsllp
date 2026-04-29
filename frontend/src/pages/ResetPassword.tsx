import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../services/api';
import { notify, notifyFormErrors } from '../services/notify';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

const schema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'At least 8 characters')
    .matches(/[A-Z]/, 'At least one uppercase letter')
    .matches(/[a-z]/, 'At least one lowercase letter')
    .matches(/[0-9]/, 'At least one number'),
  confirmPassword: yup
    .string()
    .required('Confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-lg font-bold text-red-700 mb-2">Invalid reset link</h2>
          <p className="text-sm text-gray-600 mb-4">
            This page was opened without a valid token. Please request a new password-reset email.
          </p>
          <Link to="/admin/forgot-password" className="text-orange-600 font-semibold hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: { newPassword: string }) => {
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      notify('Password has been reset. Please sign in with your new password.');
      navigate('/admin/login', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not reset password';
      notify(msg);
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Choose a new password</h2>
              <p className="text-xs text-gray-500">Make it strong — minimum 8 characters with mixed case + a number.</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, (errs) => notifyFormErrors(errs as any))}
            className="space-y-4"
            data-testid="reset-password-form"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  {...register('newPassword')}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Min 8 chars, mixed case + number"
                  data-testid="reset-newpw-input"
                />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Re-enter new password"
                  data-testid="reset-confirm-input"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-60"
              data-testid="reset-password-submit"
            >
              {submitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
