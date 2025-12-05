import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../App';
import { supabase } from '../src/lib/supabase';
import { Role } from '../types';

interface StudentStatus {
    name: string;
    roll_no: string;
    room_no: string;
    hostel_name: string;
    status: 'In Hostel' | 'On Leave';
    leave_details?: {
        from: string;
        to: string;
        place: string;
    }
}

export const StaffDashboard: React.FC = () => {
    const { profile } = useAuth();
    const [students, setStudents] = useState<StudentStatus[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'ON_LEAVE'>('ALL');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch all students
            // In a real app, we might filter by department if the staff is dept-specific
            let query = supabase.from('profiles').select('*').eq('role', Role.STUDENT);

            if (profile?.department) {
                // Optional: Filter by department if staff has one
                // query = query.eq('department', profile.department);
            }

            const { data: studentProfiles, error: studentError } = await query;
            if (studentError) throw studentError;

            // Fetch active leaves for today
            const { data: activeLeaves, error: leaveError } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('status', 'approved')
                .lte('start_date', today)
                .gte('end_date', today);

            if (leaveError) throw leaveError;

            const statusData: StudentStatus[] = (studentProfiles || []).map(student => {
                const activeLeave = activeLeaves?.find(l => l.student_id === student.id);
                return {
                    name: student.full_name || 'Unknown',
                    roll_no: student.roll_no || 'N/A',
                    room_no: student.room_no || 'N/A',
                    hostel_name: student.hostel_name || 'N/A',
                    status: activeLeave ? 'On Leave' : 'In Hostel',
                    leave_details: activeLeave ? {
                        from: activeLeave.start_date,
                        to: activeLeave.end_date,
                        place: activeLeave.reason // Using reason as place/details for now
                    } : undefined
                };
            });

            setStudents(statusData);
        } catch (e) {
            console.error("Error fetching student status:", e);
        }
    };

    const filteredStudents = filter === 'ALL'
        ? students
        : students.filter(s => s.status === 'On Leave');

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar title="Staff / Warden View" />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-4 sm:px-0">
                    <div className="bg-white/90 backdrop-blur p-4 rounded shadow border-l-4 border-gray-500">
                        <div className="text-gray-500 text-sm">Total Students</div>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded shadow border-l-4 border-green-500">
                        <div className="text-gray-500 text-sm">In Hostel</div>
                        <div className="text-2xl font-bold">{students.filter(s => s.status === 'In Hostel').length}</div>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded shadow border-l-4 border-red-500">
                        <div className="text-gray-500 text-sm">On Leave Today</div>
                        <div className="text-2xl font-bold">{students.filter(s => s.status === 'On Leave').length}</div>
                    </div>
                </div>

                {/* Filter */}
                <div className="px-4 sm:px-0 mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Student Roster</h3>
                    <div className="inline-flex rounded-md shadow-sm">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 text-sm font-medium border rounded-l-md transition-colors ${filter === 'ALL' ? 'bg-ptf-red text-white' : 'bg-white/80 text-gray-700 hover:bg-gray-50'}`}
                        >
                            All Students
                        </button>
                        <button
                            onClick={() => setFilter('ON_LEAVE')}
                            className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-md transition-colors ${filter === 'ON_LEAVE' ? 'bg-ptf-red text-white' : 'bg-white/80 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Currently on Leave
                        </button>
                    </div>
                </div>

                <div className="flex flex-col px-4 sm:px-0">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white/90 backdrop-blur">
                            <thead className="bg-red-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-gray-200">
                                {filteredStudents.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                            <div className="text-sm text-gray-500">{s.roll_no}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{s.hostel_name}</div>
                                            <div className="text-sm text-gray-500">Room {s.room_no}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.status === 'On Leave' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {s.status === 'On Leave' && s.leave_details ? (
                                                <span>
                                                    <span className="font-bold">Reason:</span> {s.leave_details.place} <br />
                                                    <span className="text-xs">({s.leave_details.from} - {s.leave_details.to})</span>
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};