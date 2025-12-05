import React, { useRef } from 'react';
import { LeaveRequest } from '../types';
import { useAuth } from '../App';

interface SlipModalProps {
   request: LeaveRequest;
   onClose: () => void;
}

export const SlipModal: React.FC<SlipModalProps> = ({ request, onClose }) => {
   const { profile } = useAuth();
   const printRef = useRef<HTMLDivElement>(null);

   // Use submitted_data if available, otherwise fallback to request/profile data
   const data = request.submitted_data || {
      name: request.student_name,
      roll_no: (request as any).student_roll_no || 'N/A', // These might be missing if not in submitted_data
      hostel: (request as any).hostel_name || 'N/A',
      room_no: (request as any).room_no || 'N/A',
      parent_mobile: (request as any).parent_mobile || 'N/A',
      place_of_visit: (request as any).place_of_visit || 'N/A',
      year: (request as any).year || 'N/A',
      department: (request as any).department || 'N/A'
   };

   const handlePrint = () => {
      const printContent = printRef.current;
      if (printContent) {
         const originalContents = document.body.innerHTML;
         document.body.innerHTML = printContent.innerHTML;
         window.print();
         document.body.innerHTML = originalContents;
         window.location.reload(); // Reload to restore event listeners
      }
   };

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
         <div className="bg-white rounded-lg w-full max-w-3xl relative shadow-2xl my-8">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
               <h2 className="text-xl font-bold text-gray-800">Leave Approval Slip</h2>
               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times text-xl"></i>
               </button>
            </div>

            {/* Modal Body (Preview) */}
            <div className="p-6 bg-gray-100 overflow-auto max-h-[70vh]">
               {/* The Slip Content - This is what gets printed */}
               <div ref={printRef} className="bg-white p-8 mx-auto shadow-lg max-w-[210mm] min-h-[297mm]" style={{ fontFamily: 'Times New Roman, serif' }}>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 border-b-4 border-red-800 pb-4">
                     <img src="/logo/logo2.1.png" alt="Logo" className="h-24 object-contain" />
                     <div className="text-right">
                        <h1 className="text-2xl font-bold text-red-800 uppercase tracking-wide">Puthiya Thalaimurai Foundation</h1>
                        <h2 className="text-lg font-semibold text-gray-800">Vizhuthugal Student Leave Portal</h2>
                        <p className="text-sm text-gray-600 mt-1">No. 24, G.N. Chetty Road, T. Nagar,<br />Chennai - 600 017</p>
                     </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-10">
                     <span className="border-2 border-gray-800 px-6 py-2 text-xl font-bold uppercase tracking-wider">
                        Leave Approval Slip
                     </span>
                  </div>

                  {/* Student Name */}
                  <div className="mb-8">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">Student Name</div>
                     <div className="text-3xl font-bold text-gray-900">{data.name}</div>
                  </div>

                  {/* Grid Details */}
                  <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12">

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Roll No / ID</div>
                        <div className="text-lg font-medium">{data.roll_no}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Year</div>
                        <div className="text-lg font-medium">{data.year}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Department</div>
                        <div className="text-lg font-medium">{data.department}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Reason</div>
                        <div className="text-lg font-medium">{request.reason}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Hostel Name</div>
                        <div className="text-lg font-medium">{data.hostel}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Room No</div>
                        <div className="text-lg font-medium">{data.room_no}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Parent's Mobile</div>
                        <div className="text-lg font-medium">{data.parent_mobile}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Place of Visit</div>
                        <div className="text-lg font-medium">{data.place_of_visit}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">From Date</div>
                        <div className="text-lg font-medium">{new Date(request.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                     </div>

                     <div className="border-b border-gray-200 pb-2">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">To Date</div>
                        <div className="text-lg font-medium">{new Date(request.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                     </div>

                  </div>

                  {/* Footer / Status */}
                  <div className="mt-16 pt-8 border-t border-gray-300 relative">
                     <div className="flex items-end justify-between">
                        <div className="text-sm text-gray-500 italic">
                           <div>Status: <span className="text-green-600 font-bold uppercase text-lg not-italic">APPROVED</span></div>
                           <div className="mt-1">By Admin</div>
                        </div>

                        <div className="text-right text-xs text-gray-400">
                           <div>This is a system generated slip. No signature required.</div>
                           <div className="mt-1">Generated on: {new Date().toLocaleString()} | ID: {request.id.substring(0, 8)}</div>
                        </div>
                     </div>

                     {/* Stamp Overlay */}
                     <div className="absolute -top-6 left-20 border-4 border-green-600 text-green-600 px-4 py-1 font-bold text-2xl uppercase opacity-80 rotate-[-10deg] pointer-events-none">
                        APPROVED
                     </div>
                  </div>

               </div>
            </div>

            {/* Modal Footer (Actions) */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
               <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
               >
                  Close
               </button>
               <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-ptf-red text-white rounded-md hover:bg-red-800 flex items-center gap-2"
               >
                  <i className="fas fa-print"></i> Print / Download PDF
               </button>
            </div>

         </div>
      </div>
   );
};