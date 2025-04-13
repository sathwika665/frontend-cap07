import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState('');
  const [year, setYear] = useState('');
  const features = [
    {
      title: 'Expected Time Of Arrival',
      icon: <img
      src="/wt copy.jpeg"
      alt="Bus Tracking"
      className="w-full max-w-2xl max-h-[400px]"

      style={{ borderRadius: '20px' }}
    />,
      description:
        'No more guesswork! Get accurate arrival times for your bus and plan your journey with ease.',
    },
    {
      title: 'Live GPS Tracking',
      icon: <img
      src="/location.jpeg"
      alt="Bus Tracking"
      className="w-full max-w-2xl max-h-[400px]"
      style={{ borderRadius: '20px' }}
    />,
      description:
        'See your bus move in real time! Stay updated with precise location tracking.',
    },
    {
      title: 'SOS ALERT',
      icon: <img
      src="/sos.jpeg"
      alt="Bus Tracking"
      className="w-full max-w-2xl max-h-[400px]"
      style={{ borderRadius: '20px' }}
    />,
      description:
        'Safety first! Instantly send emergency alerts and get quick assistance when needed.',
    },
    {
      title: 'Stops & Routes',
      icon: <img
      src="/bus-removebg-preview copy.png"
      alt="Bus Tracking"
      className="w-full max-w-2xl max-h-[400px]"
      style={{ borderRadius: '20px' }}
    />,
      description:
        'Navigate smarter! Explore all available stops and choose the best route for your journey.',
    },
  ];
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
      <div className="space-y-4 mb-6 md:flex md:justify-center md:flex-col md:items-center">
        <div className="relative">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full md:w-[500px] appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
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
            className="w-full md:w-[500px] appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
          >
            <option value="" disabled>Select Year of Study</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
          <ChevronDown  className="absolute right-4 top-3.5 text-white pointer-events-none" />
        </div>

        <button
        className="w-full  bg-green-500 md:w-[500px] text-white font-semibold py-3 rounded-full shadow hover:bg-green-600 transition"
      >
        Confirm
      </button>
      </div>

      {/* Confirm Button */}
     

      {/* Illustration */}
      <div className="mt-10 flex justify-center">
        <img
          src="/map copy.jpeg"
          alt="Bus Tracking"
          className="w-full max-w-2xl max-h-[400px]"
          style={{ borderRadius: '20px' }}
        />
      </div>
      <div className="min-h-screen bg-white p-6 flex flex-col items-center">
  <h1 className="text-2xl md:text-3xl font-bold mb-8">Features</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
    {features.map((feature, index) => (
      <div
        key={index}
        className="bg-[#F3F3F3] p-6 md:p-8 min-h-[180px] rounded-2xl shadow-md flex items-start space-x-4"
      >
        <div className="text-4xl md:text-5xl">{feature.icon}</div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{feature.title}</h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">{feature.description}</p>
          
        </div>
      </div>
      
    ))}
  </div>
  <div className="min-h-[40vh] bg-white text-white font-sans">
      {/* Header */}
      <div className="bg-white text-black px-6 py-4">
        <h2 className="font-bold text-sm">BUS BUDDIES</h2>
        <h1 className="text-3xl font-black">Contact-us</h1>
      </div>

      {/* Footer / Contact Section */}
      <footer className="bg-black text-white px-6 py-5">
        {/* About + Contact */}
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          {/* About Us */}
          <div className="sm:w-1/2">
            <h3 className="font-semibold mb-2 text-lg">ABOUT US</h3>
            <p className="text-sm leading-relaxed">
              A real-time bus tracking app for college students to view live bus locations,
              estimated arrival times, and routes, ensuring timely transportation and
              enhancing campus commuting convenience.
            </p>
          </div>

          {/* Contact Info */}
          <div className="sm:w-1/2 flex flex-col gap-1 mt-6 sm:mt-0 text-sm">
            <p className="font-semibold">GRIET</p>
            <p>+0000000000</p>
            <p>griet@gmail.com</p>
            <p className="underline cursor-pointer">-See on map</p>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mt-10 text-2xl">
          <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">📸</span>
          <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">📘</span>
          <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">✉️</span>
        </div>

        {/* Tagline */}
        <div className="border border-dashed border-white mt-10 p-4 text-center text-sm">
          Missing buses is old school—<br />
          track it, catch it, chill! 😎🚌
        </div>
      </footer>
    </div>
    </div>
    </div>
  );
}