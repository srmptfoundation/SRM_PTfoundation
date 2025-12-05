import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../App';
import { LeaveRequest, RequestStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SlipModal } from '../components/SlipModal';
import { NewLeaveRequestForm } from '../components/NewLeaveRequestForm';
import { supabase } from '../src/lib/supabase';

export const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

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

  const handleRequestSuccess = () => {
    fetchRequests();
    setTimeout(() => setActiveTab('history'), 1500);
  };

  const handleViewSlip = (req: LeaveRequest) => {
    setSelectedSlip(req);
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
            <NewLeaveRequestForm onSuccess={handleRequestSuccess} />
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