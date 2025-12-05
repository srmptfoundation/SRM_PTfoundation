import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../App';
import { LeaveRequest, RequestStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SlipModal } from '../components/SlipModal';
import { supabase } from '../src/lib/supabase';

export const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [formData, setFormData] = useState({
    reason: '',
    from_date: '',
    to_date: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // State for Slip Modal
  const [selectedSlip, setSelectedSlip] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    if (profile) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');

    if (!profile) return;

    try {
      const newRequest = {
        student_id: profile.id,
        student_name: profile.full_name || 'Unknown',
        department: profile.department || 'N/A',
        reason: formData.reason,
        start_date: formData.from_date,
        end_date: formData.to_date,
        status: RequestStatus.PENDING,
      };

      const { error } = await supabase
        .from('leave_requests')
        .insert([newRequest]);

      if (error) throw error;

      setSubmitStatus('success');
      setFormData({ reason: '', from_date: '', to_date: '' });
      fetchRequests();
      setTimeout(() => setActiveTab('history'), 1500);
    } catch (error) {
      console.error("Error submitting request:", error);
      setSubmitStatus('error');
    }
  };

  const handleViewSlip = (req: LeaveRequest) => {
    // Merge profile data into request for the slip if needed
    const slipData = {
      ...req,
      student_roll_no: profile?.roll_no,
      hostel_name: profile?.hostel_name,
      room_no: profile?.room_no,
      parent_mobile: profile?.parent_mobile,
      year: profile?.year
    };
    setSelectedSlip(slipData);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar title="Student Dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Tabs */}
          <div className="border-b border-red-200/50 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('new')}
                className={`${activeTab === 'new' ? 'border-ptf-red text-ptf-red' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                New Request
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${activeTab === 'history' ? 'border-ptf-red text-ptf-red' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Request History
              </button>
            </nav>
          </div>

          {activeTab === 'new' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg max-w-2xl border border-white/50">
              <div className="px-4 py-5 sm:px-6 bg-red-50/50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Leave Application Form</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Details are pre-filled from your profile.</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6 bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Read Only Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Name</label>
                      <div className="mt-1 text-sm text-gray-900 font-semibold">{profile?.full_name}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Roll No</label>
                      <div className="mt-1 text-sm text-gray-900">{profile?.roll_no}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Hostel / Room</label>
                      <div className="mt-1 text-sm text-gray-900">{profile?.hostel_name} - {profile?.room_no}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Parent Mobile</label>
                      <div className="mt-1 text-sm text-gray-900">{profile?.parent_mobile}</div>
                    </div>
                  </div>

                  <hr className="my-4 border-gray-200" />

                  {/* Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Leave</label>
                    <input
                      type="text"
                      required
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ptf-red focus:border-ptf-red sm:text-sm bg-white text-gray-900"
                      placeholder="e.g., Family Function, Medical"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">From Date</label>
                      <input
                        type="date"
                        required
                        value={formData.from_date}
                        onChange={e => setFormData({ ...formData, from_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ptf-red focus:border-ptf-red sm:text-sm bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">To Date</label>
                      <input
                        type="date"
                        required
                        value={formData.to_date}
                        onChange={e => setFormData({ ...formData, to_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ptf-red focus:border-ptf-red sm:text-sm bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ptf-red hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ptf-red transition-colors"
                    >
                      Submit Request
                    </button>
                  </div>

                  {submitStatus === 'success' && (
                    <div className="text-green-600 text-center text-sm font-medium">Request submitted successfully!</div>
                  )}
                  {submitStatus === 'error' && (
                    <div className="text-red-600 text-center text-sm font-medium">Failed to submit request. Please try again.</div>
                  )}
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white/90 backdrop-blur">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent divide-y divide-gray-200">
                        {requests.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No requests found.</td></tr>
                        ) : (
                          requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(req.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {req.start_date} to {req.end_date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {req.reason}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={req.status} />
                                {req.status === RequestStatus.REJECTED && req.rejection_reason && (
                                  <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-100 max-w-xs whitespace-normal">
                                    <span className="font-bold block text-[10px] uppercase text-red-400 mb-0.5">Admin Note:</span>
                                    {req.rejection_reason}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {req.status === RequestStatus.APPROVED && (
                                  <button
                                    onClick={() => handleViewSlip(req)}
                                    className="text-ptf-red hover:text-red-900 font-medium transition-colors"
                                  >
                                    <i className="fas fa-print mr-1"></i> View Slip
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Slip Modal Popup */}
      {selectedSlip && (
        <SlipModal
          request={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
};