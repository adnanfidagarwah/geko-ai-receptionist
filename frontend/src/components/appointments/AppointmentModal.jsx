// import { X } from "lucide-react";
// export default function AddAppointmentModal({ onClose }) {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

//       <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Add New Appointment
//           </h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         <form className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">Date</label>
//               <input
//                 type="date"
//                 placeholder="dd/mm/yyyy"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-1">Time</label>
//               <input
//                 type="time"
//                 placeholder="--:--"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600 mb-1">Patient Name</label>
//             <input
//               type="text"
//               placeholder="Enter patient name"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
//             <input
//               type="tel"
//               placeholder="+1 (555) 123-4567"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600 mb-1">Service</label>
//             <input
//               type="text"
//               placeholder="Type of appointment"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600 mb-1">Provider</label>
//             <input
//               type="text"
//               placeholder="Doctor or provider"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//             />
//           </div>

//           <div>
//             <label className="block text-sm text-gray-600 mb-1">Notes</label>
//             <textarea
//               rows={3}
//               placeholder="Additional notes (optional)"
//               className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
//             />
//           </div>

//           <div className="flex justify-end gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="btn-secondary font-normal"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="btn-primary font-normal"
//             >
//               Book Appointment
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Stethoscope,
  ClipboardList,
  FileText,
} from "lucide-react";

export default function AddAppointmentModal({ onClose }) {
  // ✅ Individual States for Each Input
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      date,
      time,
      patientName,
      phone,
      service,
      provider,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Add New Appointment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Patient Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Service</label>
            <div className="relative">
              <ClipboardList className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type of appointment"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Provider</label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Doctor or provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                rows={3}
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-normal"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition font-normal"
            >
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
