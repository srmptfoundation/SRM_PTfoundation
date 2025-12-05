import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Forbidden: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
                {/* Circular Logo */}
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo/logo1-removebg-preview.png"
                        alt="PTF Logo"
                        className="h-20 w-20 object-contain"
                    />
                </div>

                <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mb-6 text-gray-600">
                    Your account is not authorized to access this application. Please contact your administrator if you believe this is an error.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-gray-700"
                >
                    Go to Sign In
                </button>
            </div>
        </div>
    );
};
