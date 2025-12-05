import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { LeaveRequest, RequestStatus } from '../types';

const API_URL = 'http://localhost:3001/api';

export const Slip: React.FC = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlip = async () => {
        try {
            const res = await fetch(`${API_URL}/request/${id}/slip`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Could not load slip");
            setData(await res.json());
        } catch (e) {
             // Mock fallback for demo mode
             if (token && token.includes('demo')) {
                 setData({
                     id: id || 'demo-req',
                     student_name: 'Hari Kumar',
                     student_roll_no: 'RA2011002010234',
                     department: 'B.Tech Mech',
                     year: '4th Year',
                     hostel_name: 'JA BLOCK',
                     room_no: '410',
                     parent_mobile: '9025085588',
                     from_date: '2023-11-01',
                     to_date: '2023-11-02',
                     reason: 'Medical Checkup',
                     place: 'Chennai',
                     status: RequestStatus.APPROVED,
                     approved_by: 'Mr. A. Maniraj',
                     approval_date: '2023-10-31',
                     system_id: 'e7928a19',
                     created_at: '2023-10-30'
                 });
             } else {
                setError("Slip not found or unauthorized.");
             }
        }
    };
    fetchSlip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-10 text-center">Loading Slip...</div>;

  return (
    <div className="min-h-screen bg-transparent p-8 print:p-0 print:bg-white flex justify-center items-start">
      <div className="bg-white w-[21cm] shadow-xl print:shadow-none p-10 relative">
        
        {/* Print Controls - Hidden when printing */}
        <div className="absolute top-4 right-4 print:hidden flex space-x-2">
            <button onClick={() => window.print()} className="bg-ptf-red text-white px-4 py-2 rounded shadow hover:bg-red-800 transition-colors">
                <i className="fas fa-print mr-2"></i> Print Slip
            </button>
            <button onClick={() => window.close()} className="bg-gray-300 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-400 transition-colors">
                Close
            </button>
        </div>

        {/* Slip Header */}
        <div className="text-center border-b-2 border-ptf-red pb-4 mb-6">
            <div className="flex justify-center items-center mb-2">
                <div className="h-16 w-16 mr-4 bg-white border border-red-100 rounded-full flex items-center justify-center p-1">
                   <img 
                      src="logo/logo.png" 
                      alt="Logo" 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                   />
                   <i className="fas fa-university text-4xl text-ptf-red hidden"></i>
                </div>
                <div className="text-left">
                    <h1 className="text-2xl font-bold text-ptf-red uppercase tracking-wide">Puthiya Thalaimurai Foundation</h1>
                    <p className="text-sm text-gray-600">Vizhuthugal Student Hostel</p>
                </div>
            </div>
            <h2 className="text-xl font-semibold mt-4">HOSTEL LEAVE / OUT PASS</h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-y-6 text-sm text-gray-800">
            <div className="col-span-2 flex justify-between">
                <div>
                    <span className="font-bold text-gray-500 uppercase text-xs block">Student Name</span>
                    <span className="text-lg font-semibold">{data.student_name}</span>
                </div>
                <div className="text-right">
                    <span className="font-bold text-gray-500 uppercase text-xs block">Roll Number</span>
                    <span className="text-lg font-mono">{data.student_roll_no}</span>
                </div>
            </div>

            <div className="col-span-1">
                <span className="font-bold text-gray-500 uppercase text-xs block">Course / Year</span>
                <span className="text-base">{data.department} ({data.year})</span>
            </div>
            <div className="col-span-1 text-right">
                <span className="font-bold text-gray-500 uppercase text-xs block">Hostel / Room</span>
                <span className="text-base">{data.hostel_name} - {data.room_no}</span>
            </div>

            <div className="col-span-2 border-t border-dashed border-gray-300 my-2"></div>

            <div className="col-span-1">
                <span className="font-bold text-gray-500 uppercase text-xs block">Leave From</span>
                <span className="text-lg">{data.from_date}</span>
            </div>
            <div className="col-span-1 text-right">
                <span className="font-bold text-gray-500 uppercase text-xs block">Leave To</span>
                <span className="text-lg">{data.to_date}</span>
            </div>

            <div className="col-span-2 bg-gray-50 p-3 rounded border border-gray-100">
                <span className="font-bold text-gray-500 uppercase text-xs block">Reason for Leave</span>
                <span className="text-base font-medium">{data.reason}</span>
                <br/>
                <span className="font-bold text-gray-500 uppercase text-xs block mt-2">Place of Visit</span>
                <span className="text-base">{data.place || '-'}</span>
            </div>
        </div>

        {/* Footer / System Info */}
        <div className="mt-12 pt-6 border-t-2 border-gray-800 flex justify-between items-end">
            <div className="text-left">
                <div className="inline-block border-2 border-green-600 text-green-700 font-bold px-4 py-1 rounded text-lg transform -rotate-6 mb-2">
                    APPROVED
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    System ID: <span className="font-mono">{data.system_id}</span>
                </p>
                <p className="text-xs text-gray-500">
                    Approved Date: {data.approval_date}
                </p>
            </div>

            <div className="text-center">
                <div className="h-10 border-b border-gray-400 w-48 mb-1"></div>
                <p className="font-bold text-sm">{data.approved_by}</p>
                <p className="text-xs text-gray-500 uppercase">Warden / Authority Signature</p>
            </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
            <p>Note: This is a system generated slip. Student must produce this at the security gate.</p>
        </div>
      </div>
    </div>
  );
};