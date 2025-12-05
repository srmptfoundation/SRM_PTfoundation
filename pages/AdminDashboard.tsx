import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../App';
import { LeaveRequest, RequestStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { supabase } from '../src/lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'export'>('requests');

  // Pending Requests State
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvedByName, setApprovedByName] = useState(profile?.full_name || '');
  const [rejectionReason, setRejectionReason] = useState('');

  // User Management State
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'staff'>('student');
  const [allowedEmails, setAllowedEmails] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState('');

  // Export State
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setApprovedByName(profile.full_name);
    }
  }, [profile]);

  useEffect(() => {
    fetchPending();
    fetchAllowedEmails();
  }, []);

  const fetchPending = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, profiles:student_id(*)')
        .eq('status', RequestStatus.PENDING)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedData = (data || []).map((req: any) => {
        const submitted = req.submitted_data || {};
        return {
          ...req,
          // Prefer submitted data, fallback to profile data
          student_name: submitted.name || req.student_name,
          student_roll_no: submitted.roll_no || req.profiles?.roll_no,
          hostel_name: submitted.hostel || req.profiles?.hostel_name,
          room_no: submitted.room_no || req.profiles?.room_no,
          parent_mobile: submitted.parent_mobile || req.profiles?.parent_mobile,
          year: submitted.year || req.profiles?.year,
          place_of_visit: submitted.place_of_visit || 'N/A',
          department: submitted.department || req.department
        };
      });

      setPendingRequests(mappedData);
    } catch (e) {
      console.error("Error fetching pending requests:", e);
    }
  };

  const fetchAllowedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllowedEmails(data || []);
    } catch (e) {
      console.error("Error fetching allowed emails:", e);
    }
  };

  const handleAction = async (id: string, status: RequestStatus) => {
    try {
      const updates: any = { status };

      if (status === RequestStatus.APPROVED) {
        updates.approved_by = approvedByName;
        updates.approved_at = new Date().toISOString();
      } else if (status === RequestStatus.REJECTED) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // If approved, trigger slip generation (optional, but good practice to ensure it exists)
      if (status === RequestStatus.APPROVED) {
        // We can fire-and-forget the edge function call here if needed
        supabase.functions.invoke('generate_slip', {
          body: JSON.stringify({ request_id: id })
        });
      }

      resetActionStates();
      fetchPending();
    } catch (e) {
      console.error("Error updating request:", e);
      alert("Failed to update request");
    }
  };

  const resetActionStates = () => {
    setApprovingId(null);
    setRejectingId(null);
    setRejectionReason('');
  };

  const initiateApprove = (id: string) => {
    setRejectingId(null);
    setApprovingId(id);
  };

  const initiateReject = (id: string) => {
    setApprovingId(null);
    setRejectingId(id);
    setRejectionReason('');
  };

  // Add single email
  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      alert('Please enter an email');
      return;
    }

    try {
      const { error } = await supabase
        .from('allowed_emails')
        .insert([{ email: newEmail.toLowerCase().trim(), role: newRole, added_by: profile?.id }]);

      if (error) throw error;

      alert('Email added successfully!');
      setNewEmail('');
      fetchAllowedEmails();
    } catch (e: any) {
      console.error("Error adding email:", e);
      if (e.code === '23505') {
        alert('This email already exists in the allowed list');
      } else {
        alert('Failed to add email');
      }
    }
  };

  // Handle CSV import
  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setImportStatus('Processing...');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
        const emails = lines.slice(startIndex).map(line => {
          const email = line.split(',')[0].trim().toLowerCase();
          return { email, role: newRole, added_by: profile?.id };
        }).filter(item => item.email && item.email.includes('@'));

        if (emails.length === 0) {
          setImportStatus('No valid emails found in CSV');
          return;
        }

        const { data, error } = await supabase
          .from('allowed_emails')
          .insert(emails)
          .select();

        if (error) throw error;

        setImportStatus(`Successfully imported ${data?.length || 0} emails`);
        setCsvFile(null);
        fetchAllowedEmails();
        setTimeout(() => setImportStatus(''), 3000);
      } catch (e: any) {
        console.error("Error importing CSV:", e);
        setImportStatus('Import failed. Some emails may already exist.');
        setTimeout(() => setImportStatus(''), 3000);
      }
    };

    reader.readAsText(csvFile);
  };

  // Remove email
  const handleRemoveEmail = async (id: string) => {
    if (!confirm('Are you sure you want to remove this email from the allowed list?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchAllowedEmails();
    } catch (e) {
      console.error("Error removing email:", e);
      alert('Failed to remove email');
    }
  };

  // Export report
  const handleExport = async () => {
    if (!exportFromDate || !exportToDate) {
      alert('Please select both from and to dates');
      return;
    }

    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, profiles:student_id(*)')
        .gte('start_date', exportFromDate)
        .lte('end_date', exportToDate)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Convert to CSV
      const csv = [
        ['Student Name', 'Email', 'Department', 'Start Date', 'End Date', 'Reason', 'Status', 'Approved By', 'Created At'].join(','),
        ...(data || []).map((req: any) => [
          req.student_name,
          req.profiles?.email || '',
          req.department,
          req.start_date,
          req.end_date,
          `"${req.reason}"`,
          req.status,
          req.approved_by || '',
          new Date(req.created_at).toLocaleDateString()
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave_requests_${exportFromDate}_to_${exportToDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert('Report exported successfully!');
    } catch (e) {
      console.error("Error exporting:", e);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar title="Admin Dashboard" />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-red-200/50 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`${activeTab === 'requests' ? 'border-ptf-red text-ptf-red' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${activeTab === 'users' ? 'border-ptf-red text-ptf-red' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`${activeTab === 'export' ? 'border-ptf-red text-ptf-red' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Export Reports
              </button>
            </nav>
          </div>

          {/* Pending Requests Tab */}
          {activeTab === 'requests' && (
            <div className="grid gap-6">
              <h2 className="text-xl font-bold text-gray-800">Pending Leave Requests</h2>
              {pendingRequests.length === 0 && (
                <p className="text-gray-500 italic">No pending requests at the moment.</p>
              )}

              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white/90 backdrop-blur shadow rounded-lg p-6 border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{req.student_name} <span className="text-gray-500 text-sm font-normal">({req.student_roll_no || 'No Roll No'})</span></h3>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        <div><span className="font-semibold text-gray-800">Department:</span> {req.department}</div>
                        <div><span className="font-semibold text-gray-800">Year:</span> {req.year || 'N/A'}</div>
                        <div><span className="font-semibold text-gray-800">Hostel:</span> {req.hostel_name || 'N/A'}</div>
                        <div><span className="font-semibold text-gray-800">Room No:</span> {req.room_no || 'N/A'}</div>
                        <div><span className="font-semibold text-gray-800">Place of Visit:</span> {(req as any).place_of_visit || 'N/A'}</div>
                        <div className="text-red-600 font-medium"><i className="fas fa-phone mr-1"></i> Parent: {req.parent_mobile || 'N/A'}</div>
                      </div>

                      <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-100">
                        <div className="text-sm">
                          <span className="font-bold text-gray-800 block mb-1">Reason for Leave:</span>
                          {req.reason}
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-900">
                          <i className="far fa-calendar-alt mr-2 text-gray-500"></i>
                          {req.start_date} <i className="fas fa-arrow-right text-xs mx-2 text-gray-400"></i> {req.end_date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4 flex justify-end space-x-3">
                    {approvingId === req.id ? (
                      <div className="flex items-center space-x-2 animate-fade-in bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-xs font-semibold text-green-800 uppercase mr-1">Approval:</span>
                        <input
                          type="text"
                          value={approvedByName}
                          onChange={e => setApprovedByName(e.target.value)}
                          className="border border-green-300 rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                          placeholder="Signatory Name"
                        />
                        <button onClick={() => handleAction(req.id, RequestStatus.APPROVED)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 shadow-sm">Confirm</button>
                        <button onClick={resetActionStates} className="text-gray-500 text-sm hover:text-gray-700 px-2">Cancel</button>
                      </div>
                    ) : rejectingId === req.id ? (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 animate-fade-in bg-red-50 p-2 rounded border border-red-200 w-full sm:w-auto">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection (Required)..."
                          className="border border-red-300 rounded px-2 py-1 text-sm focus:ring-red-500 focus:border-red-500 w-full sm:w-64"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(req.id, RequestStatus.REJECTED)}
                            disabled={!rejectionReason.trim()}
                            className={`px-3 py-1 rounded text-sm shadow-sm whitespace-nowrap transition-colors ${!rejectionReason.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                          >
                            Reject
                          </button>
                          <button
                            onClick={resetActionStates}
                            className="text-gray-500 text-sm hover:text-gray-700 px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => initiateReject(req.id)}
                          className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100 border border-red-200 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => initiateApprove(req.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">User Management</h2>

              {/* Single Add */}
              <div className="bg-white/90 backdrop-blur shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Single Email</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-ptf-red focus:border-ptf-red"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'student' | 'staff')}
                      className="border border-gray-300 rounded px-3 py-2 focus:ring-ptf-red focus:border-ptf-red"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddEmail}
                    className="bg-ptf-red text-white px-6 py-2 rounded hover:bg-red-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* CSV Import */}
              <div className="bg-white/90 backdrop-blur shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import (CSV)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSV File (one email per line)</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: email@example.com (one per line, optional header)</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as 'student' | 'staff')}
                        className="border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCsvImport}
                      disabled={!csvFile}
                      className="bg-ptf-red text-white px-6 py-2 rounded hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      Import CSV
                    </button>
                  </div>
                  {importStatus && (
                    <div className="text-sm text-green-600 font-medium">{importStatus}</div>
                  )}
                </div>
              </div>

              {/* Allowed Emails List */}
              <div className="bg-white/90 backdrop-blur shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Allowed Emails ({allowedEmails.length})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allowedEmails.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleRemoveEmail(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Export Reports</h2>

              <div className="bg-white/90 backdrop-blur shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range Export</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={exportFromDate}
                        onChange={(e) => setExportFromDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-ptf-red focus:border-ptf-red"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        value={exportToDate}
                        onChange={(e) => setExportToDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-ptf-red focus:border-ptf-red"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exporting || !exportFromDate || !exportToDate}
                    className="bg-ptf-red text-white px-6 py-2 rounded hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? 'Exporting...' : 'Download CSV Report'}
                  </button>
                  <p className="text-sm text-gray-500">
                    This will export all leave requests within the selected date range as a CSV file.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};