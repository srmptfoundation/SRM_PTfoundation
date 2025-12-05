import React from 'react';
import { LeaveRequest } from '../types';

interface SlipModalProps {
  request: LeaveRequest;
  onClose: () => void;
}

export const SlipModal: React.FC<SlipModalProps> = ({ request, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:block">
      
      {/* Container */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:max-w-none print:h-auto">
        
        {/* Toolbar (Hidden on Print) */}
        <div className="bg-gray-100 px-4 py-3 flex justify-between items-center rounded-t-lg border-b print:hidden flex-shrink-0">
           <h3 className="font-semibold text-gray-700">Approval Slip Preview</h3>
           <div className="flex space-x-2">
             <button 
                onClick={() => window.print()} 
                className="bg-ptf-red text-white px-4 py-2 rounded text-sm hover:bg-red-800 flex items-center gap-2 font-medium shadow-sm transition-colors"
             >
                <i className="fas fa-print"></i> Print
             </button>
             <button 
                onClick={onClose} 
                className="bg-white text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 border border-gray-300 font-medium transition-colors"
             >
                Close
             </button>
           </div>
        </div>

        {/* Printable Content - Scrollable on screen, Full on print */}
        <div className="overflow-y-auto p-8 md:p-12 print:p-0 print:overflow-visible flex-grow" id="printable-area">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                     {/* Logo Section */}
                     <div className="w-20 h-20 rounded-full flex-shrink-0 bg-white border-2 border-ptf-maroon flex items-center justify-center shadow-sm overflow-hidden p-1">
                        <img 
                          src="logo/logo.png" 
                          alt="PTF Logo" 
                          className="w-full h-full object-contain" 
                          onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.nextElementSibling?.classList.remove('hidden');
                             e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                          }}
                        />
                        <i className="fas fa-university text-3xl text-ptf-maroon hidden"></i>
                     </div>
                     <div>
                         <div className="bg-ptf-maroon text-white text-[10px] px-2 py-0.5 inline-block rounded-sm mb-1 uppercase tracking-wider font-bold">Foundation</div>
                         <h1 className="text-2xl md:text-3xl font-serif font-bold text-ptf-maroon leading-tight tracking-wide">
                            PUTHIYA <br/> THALAIMURAI <br/> FOUNDATION
                         </h1>
                     </div>
                </div>
                <div className="text-right hidden sm:block">
                     <h2 className="text-lg font-semibold text-gray-800">Vizhuthugal Student<br/>Leave Portal</h2>
                     <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        No. 24, G.N. Chetty Road,<br/>
                        T. Nagar, Chennai - 600 017
                     </p>
                </div>
            </div>

            <div className="w-full h-0.5 bg-ptf-maroon mb-8"></div>

            {/* Title Box */}
            <div className="flex justify-center mb-10">
                <div className="border-2 border-gray-900 px-8 py-2 bg-white">
                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest font-serif">Leave Approval Slip</h3>
                </div>
            </div>

            {/* Student Details */}
            <div className="space-y-1">
                 
                 {/* Name */}
                 <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Student Name</p>
                    <p className="text-3xl font-serif font-bold text-gray-900 mt-1">{request.student_name}</p>
                 </div>

                 <div className="border-b border-gray-200 my-4"></div>

                 {/* Row 1 */}
                 <div className="grid grid-cols-2 gap-8 py-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Roll No / ID</p>
                        <p className="text-lg font-medium text-gray-900">{request.student_roll_no}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Year</p>
                        <p className="text-lg font-medium text-gray-900">{request.year}</p>
                    </div>
                 </div>

                 <div className="border-b border-gray-200 my-4"></div>

                 {/* Row 2 */}
                 <div className="grid grid-cols-2 gap-8 py-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</p>
                        <p className="text-lg font-medium text-gray-900">{request.department}</p>
                    </div>
                    <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason</p>
                         <p className="text-lg font-medium text-gray-900">{request.reason}</p>
                    </div>
                 </div>

                 <div className="border-b border-gray-200 my-4"></div>

                 {/* Row 3 */}
                 <div className="grid grid-cols-2 gap-8 py-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hostel Name</p>
                        <p className="text-lg font-medium text-gray-900">{request.hostel_name} (Off Campus)</p>
                    </div>
                    <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Room No</p>
                         <p className="text-lg font-medium text-gray-900">{request.room_no}</p>
                    </div>
                 </div>

                 <div className="border-b border-gray-200 my-4"></div>

                 {/* Row 4 */}
                 <div className="grid grid-cols-2 gap-8 py-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Parent's Mobile</p>
                        <p className="text-lg font-medium text-gray-900">{request.parent_mobile}</p>
                    </div>
                    <div>
                         {/* Place of visit removed from form, so displaying only if legacy data exists, or empty */}
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Place of Visit</p>
                         <p className="text-lg font-medium text-gray-900">{request.place || '-'}</p>
                    </div>
                 </div>

                 <div className="border-b border-gray-200 my-4"></div>

                 {/* Dates */}
                 <div className="grid grid-cols-2 gap-8 py-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From Date</p>
                        <p className="text-xl font-bold text-gray-900">{request.from_date}</p>
                    </div>
                    <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To Date</p>
                         <p className="text-xl font-bold text-gray-900">{request.to_date}</p>
                    </div>
                 </div>
                 
                 <div className="border-b border-gray-200 my-4"></div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="text-lg font-serif font-bold line-through text-gray-400">Status</span>
                    <span className="text-green-700 font-bold text-xl bg-green-50 px-3 py-1 border border-green-200 uppercase tracking-wider shadow-sm">
                        APPROVED
                    </span>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row justify-between items-end gap-8 mt-12">
                     <p className="text-sm italic text-gray-600 max-w-md leading-relaxed">
                        "By <span className="font-bold text-gray-900 not-italic border-b border-gray-400">{request.approved_by || 'Authority'}</span>, Project Manager, Puthiya Thalaimurai Foundation."
                     </p>
                     
                     <div className="text-right">
                        {/* Signature Line */}
                        <div className="h-px bg-gray-400 w-48 mb-2"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Authorized Signature</p>
                     </div>
                 </div>
                 
                 <div className="mt-10 flex justify-between text-[9px] text-gray-400 border-t border-gray-100 pt-3 font-mono">
                    <span>Note: This is a system generated slip. No signature required.</span>
                    <span>ID: {request.system_id || 'N/A'}</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};