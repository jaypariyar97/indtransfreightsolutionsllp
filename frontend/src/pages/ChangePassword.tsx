import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { notify, notifyFormErrors } from '../services/notify';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const schema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
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

type FormValues = yup.InferType<typeof schema>;

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  const mustChange = !!user?.mustChangePassword;

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    console.log('JWT TOKEN:', localStorage.getItem('jwt_token'));
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      updateUser({ mustChangePassword: false });
      notify('Password updated successfully');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to change password';
      notify(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    notifyFormErrors(formErrors as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.jpeg" alt="INDTRANS" className="h-12 mb-3" />
          <h1 className="text-xl font-black text-gray-900 tracking-widest uppercase text-center">
            INDTRANS FREIGHT SOLUTIONS LLP
            {/* <span className="text-orange-600">LLP</span> */}
          </h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mustChange ? 'Set a new password' : 'Change password'}
              </h2>
              <p className="text-xs text-gray-500">
                {mustChange
                  ? 'First-time login — please choose a strong password.'
                  : 'Update your account password.'}
              </p>
            </div>
          </div>

          {mustChange && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
              Your account is using the default password. You must set a new one before continuing.
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-4"
            data-testid="change-password-form"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  {...register('currentPassword')}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter current password"
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  {...register('newPassword')}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Min 8 chars, mixed case + number"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Re-enter new password"
                  data-testid="confirm-password-input"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-60"
              data-testid="change-password-submit"
            >
              {submitting ? 'Saving…' : 'Update password'}
            </button>

            {!mustChange && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            )}
            {mustChange && (
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-red-600"
              >
                Sign out instead
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
