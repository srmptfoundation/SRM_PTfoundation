import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../App';
import { RequestStatus } from '../types';

interface NewLeaveRequestFormProps {
    onSuccess: () => void;
}

export const NewLeaveRequestForm: React.FC<NewLeaveRequestFormProps> = ({ onSuccess }) => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [formData, setFormData] = useState({
        name: '',
        roll_no: '',
        hostel: '',
        room_no: '',
        parent_mobile: '',
        place_of_visit: '',
        year: '',
        from_date: '',
        to_date: '',
        reason: ''
    });

    // Pre-fill form from profile
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.full_name || '',
                roll_no: profile.roll_no || '',
                hostel: profile.hostel_name || '',
                room_no: profile.room_no || '',
                parent_mobile: profile.parent_mobile || '',
                year: profile.year || '',
            }));
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitStatus('idle');

        try {
            if (!user) throw new Error('No user found');

            const { error } = await supabase.from('leave_requests').insert({
                student_id: user.id,
                // We still populate the old columns for backward compatibility/easy querying
                student_name: formData.name,
                department: profile?.department || 'N/A', // Keep department from profile as it's less likely to change per request? Or should we allow edit? User didn't explicitly ask for dept edit but "every detail". Let's stick to the requested fields.
                reason: formData.reason,
                start_date: formData.from_date,
                end_date: formData.to_date,
                status: RequestStatus.PENDING,
                // New JSONB column for the full snapshot of submitted data
                submitted_data: {
                    name: formData.name,
                    roll_no: formData.roll_no,
                    hostel: formData.hostel,
                    room_no: formData.room_no,
                    parent_mobile: formData.parent_mobile,
                    place_of_visit: formData.place_of_visit,
                    year: formData.year,
                    department: profile?.department || 'N/A'
                }
            });

            if (error) throw error;

            setSubmitStatus('success');
            // Reset form (keep personal details, clear request specific ones)
            setFormData(prev => ({
                ...prev,
                from_date: '',
                to_date: '',
                reason: '',
                place_of_visit: ''
            }));

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Error submitting request:', error);
            setSubmitStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg max-w-3xl border border-white/50 mx-auto">
            <div className="px-4 py-5 sm:px-6 bg-red-50/50 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">New Leave Application</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Please review and update your details before submitting.
                </p>
            </div>

            <div className="px-4 py-5 sm:p-6 bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Personal Details Section */}
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wider">Student Details</h4>
                        <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Roll No</label>
                                <input
                                    type="text"
                                    name="roll_no"
                                    required
                                    value={formData.roll_no}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                    placeholder="e.g. 4th Year"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Mobile</label>
                                <input
                                    type="text"
                                    name="parent_mobile"
                                    required
                                    value={formData.parent_mobile}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hostel Name</label>
                                <input
                                    type="text"
                                    name="hostel"
                                    value={formData.hostel}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Room No</label>
                                <input
                                    type="text"
                                    name="room_no"
                                    value={formData.room_no}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Leave Details Section */}
                    <div className="bg-red-50/30 p-4 rounded-md border border-red-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wider">Leave Details</h4>
                        <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Reason for Leave</label>
                                <input
                                    type="text"
                                    name="reason"
                                    required
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                    placeholder="e.g., Family Function, Medical"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Place of Visit</label>
                                <input
                                    type="text"
                                    name="place_of_visit"
                                    required
                                    value={formData.place_of_visit}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                    placeholder="e.g. Salem, Attur"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">From Date</label>
                                <input
                                    type="date"
                                    name="from_date"
                                    required
                                    value={formData.from_date}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    name="to_date"
                                    required
                                    value={formData.to_date}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-ptf-red focus:border-ptf-red sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ptf-red hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ptf-red transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>

                    {submitStatus === 'success' && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-check-circle text-green-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">Request submitted successfully!</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-times-circle text-red-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">Failed to submit request. Please try again.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
