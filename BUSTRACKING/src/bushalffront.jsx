import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState('');
  const [year, setYear] = useState('');

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 md:px-12 py-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <img src="/LOGO.png" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12" />
          <div className="font-bold text-lg sm:text-xl text-gray-800 leading-tight">
            Gokaraju
            <br />
            <span className="text-sm sm:text-base font-normal">Bus Buddies</span>
          </div>
        </div>
        </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        SEAMLESS BUS MONITORING MADE EASY
      </h1>
      <p className="text-base sm:text-lg text-gray-700 mb-6">Track - Ride - Arrive</p>

      {/* Dropdowns */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
          >
            <option value="" disabled>Select Bus Route</option>
            <option value="Route 1">Route 1</option>
            <option value="Route 2">Route 2</option>
          </select>
          <ChevronDown className="absolute right-4 top-3.5 text-white pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
          >
            <option value="" disabled>Select Year of Study</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
          <ChevronDown className="absolute right-4 top-3.5 text-white pointer-events-none" />
        </div>
      </div>

      {/* Confirm Button */}
      <button
        className="w-full bg-green-500 text-white font-semibold py-3 rounded-full shadow hover:bg-green-600 transition"
      >
        Confirm
      </button>

      {/* Illustration */}
      <div className="mt-10 flex justify-center">
        <img
          src="/map copy.jpeg"
          alt="Bus Tracking"
          className="w-full max-w-4xl h-auto object-cover rounded-xl shadow-md"
        />
      </div>
    </div>
  );
}