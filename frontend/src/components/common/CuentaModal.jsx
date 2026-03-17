import React, { useState } from 'react';

// ============================================================
// CONSTANTS
// ============================================================
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// ============================================================
// COMPONENT
// ============================================================
const CuentaModal = ({ isOpen, onClose }) => {

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getToken = () => localStorage.getItem('token');

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const validatePasswordChange = () => {

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return false;
    }

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    const token = getToken();

    if (!token) {
      alert('❌ No hay sesión activa.');
      return false;
    }

    return true;
  };

  const handlePasswordChange = async () => {

    if (!validatePasswordChange()) return;

    setLoading(true);

    try {

      const token = getToken();

      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert('❌ ' + (data.message || 'Error al cambiar contraseña'));
        return;
      }

      alert('✅ Contraseña cambiada');
      resetPasswordForm();

    } catch (error) {

      console.error(error);
      alert('❌ Error del servidor');

    } finally {
      setLoading(false);
    }
  };

  const validateDeactivateAccount = () => {

    if (!deactivateReason.trim()) {
      alert('Indica el motivo');
      return false;
    }

    const confirmed = window.confirm(
      '⚠️ ¿Seguro que quieres desactivar tu cuenta?'
    );

    if (!confirmed) return false;

    const token = getToken();

    if (!token) {
      alert('No hay sesión activa');
      return false;
    }

    return true;
  };

  const handleDeactivateAccount = async () => {

    if (!validateDeactivateAccount()) return;

    setLoading(true);

    try {

      const token = getToken();

      const res = await fetch(`${API_URL}/users/me/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: deactivateReason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert('❌ ' + (data.message || 'Error'));
        return;
      }

      alert('Cuenta desactivada');
      logoutAndRedirect();

    } catch (error) {

      console.error(error);
      alert('Error del servidor');

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 p-6 text-white">

          <div className="flex items-center justify-between">

            {/* Ícono de cuenta para balancear el layout */}
            <span className="text-2xl">👤</span>

            <h2 className="text-2xl font-bold">Cuenta</h2>

            {/* Botón X para cerrar — igual al modal de Notificaciones */}
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>

          </div>

        </div>

        {/* OPCIONES */}
        <div className="p-6 space-y-4">

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >

            <span className="text-lg font-medium text-gray-800">
              Contraseña
            </span>

            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

          </button>

          <button
            onClick={() => setShowDeactivateModal(true)}
            className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >

            <span className="text-lg font-medium text-red-600">
              Eliminar cuenta
            </span>

            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

          </button>

        </div>

      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        loading={loading}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handlePasswordChange}
      />

      <DeactivateModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        loading={loading}
        deactivateReason={deactivateReason}
        onReasonChange={setDeactivateReason}
        onSubmit={handleDeactivateAccount}
      />

    </div>
  );
};


// ============================================================
// PASSWORD MODAL
// ============================================================

const PasswordModal = ({
  isOpen,
  onClose,
  loading,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}) => {

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">

        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 p-6 text-white">

          <div className="flex items-center justify-between">

            <span className="text-2xl">🔒</span>

            <h3 className="text-xl font-bold">
              Cambiar Contraseña
            </h3>

            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>

          </div>

        </div>

        <div className="p-6 space-y-4">

          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={onSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>

        </div>

      </div>

    </div>
  );
};


// ============================================================
// DEACTIVATE MODAL
// ============================================================

const DeactivateModal = ({
  isOpen,
  onClose,
  loading,
  deactivateReason,
  onReasonChange,
  onSubmit,
}) => {

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">

          <div className="flex items-center justify-between">

            <span className="text-2xl">⚠️</span>

            <h3 className="text-xl font-bold">
              Eliminar Cuenta
            </h3>

            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>

          </div>

        </div>

        <div className="p-6 space-y-4">

          <textarea
            value={deactivateReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            rows={4}
            placeholder="Motivo de desactivación"
          />

          <div className="flex gap-3">

            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Desactivando...' : 'Desactivar'}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default CuentaModal;