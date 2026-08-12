import React from 'react';
import { Shield, ArrowRight, Lock, Radio, PhoneCall, CheckCircle, MapPin, Users } from 'lucide-react';

interface HeroLandingProps {
  onStartJourney: () => void;
  onLearnMore: () => void;
  onSignIn: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onStartJourney, onLearnMore, onSignIn }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#191c1e] flex flex-col">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#f2f3f6] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#532dcf] flex items-center justify-center text-white">
              <Shield className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-bold text-[#532dcf] tracking-tight">NexGuard</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#484555] hover:text-[#532dcf] transition-colors">
              Features
            </a>
            <a href="#privacy" className="text-sm font-medium text-[#484555] hover:text-[#532dcf] transition-colors">
              Privacy First
            </a>
            <a href="#faq" className="text-sm font-medium text-[#484555] hover:text-[#532dcf] transition-colors">
              FAQ
            </a>
            <button
              onClick={onSignIn}
              className="bg-[#532dcf] text-white font-medium px-6 py-2.5 rounded-full hover:bg-[#481cc4] transition-all shadow-sm hover:shadow-md text-sm"
            >
              Get Started / Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="relative pt-16 pb-24 overflow-hidden bg-gradient-to-b from-[#f0ecff]/40 to-[#f8f9fc]">
          <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight">
                Your journey. <br />
                <span className="text-[#532dcf]">Your safety.</span> <br />
                Your control.
              </h1>
              <p className="text-lg text-[#484555] max-w-xl leading-relaxed">
                Intelligent journey protection that keeps you connected to the people you trust. Experience true peace of mind with real-time monitoring and instant emergency alerts.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={onStartJourney}
                  className="bg-[#532dcf] text-white font-semibold px-8 py-3.5 rounded-full hover:bg-[#481cc4] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-base active:scale-95"
                >
                  <span>Start Your Safe Journey</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onLearnMore}
                  className="bg-white text-[#532dcf] border border-[#532dcf]/20 font-semibold px-8 py-3.5 rounded-full hover:bg-[#eee7ff]/50 transition-all text-base active:scale-95"
                >
                  Learn How It Works
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-4 pt-6 border-t border-[#e1e2e5]">
                <div className="flex -space-x-3">
                  <img
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
                    alt="User"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=128&q=80"
                    alt="User"
                  />
                  <img
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=128&q=80"
                    alt="User"
                  />
                </div>
                <p className="text-sm font-medium text-[#484555]">Trusted by 10,000+ women and families daily.</p>
              </div>
            </div>

            {/* Right Bento Visual Grid */}
            <div className="grid grid-cols-2 grid-rows-3 gap-4 h-[520px]">
              {/* Card 1: Live Tracking */}
              <div className="row-span-2 col-span-1 rounded-3xl overflow-hidden relative group border border-[#e1e2e5] shadow-sm bg-white p-5 flex flex-col justify-between">
                <div className="bg-[#f0ecff] p-3 rounded-2xl w-fit text-[#532dcf]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#191c1e] mb-1">Live Tracking</h3>
                  <p className="text-xs text-[#484555]">Real-time location updates for your trusted contacts only during active trips.</p>
                </div>
                <div className="bg-[#f2f3f6] rounded-xl p-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-[#191c1e]">ETA 14 min • Route Safe</span>
                </div>
              </div>

              {/* Card 2: Instant SOS */}
              <div className="col-span-1 rounded-3xl p-5 bg-[#6c4ce8]/10 border border-[#6c4ce8]/20 flex flex-col justify-center items-start">
                <div className="w-10 h-10 rounded-full bg-[#532dcf] text-white flex items-center justify-center mb-3">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#191c1e] mb-1">Instant SOS</h3>
                <p className="text-xs text-[#484555]">One-tap emergency broadcast to trusted network.</p>
              </div>

              {/* Card 3: End-to-End Encryption */}
              <div className="col-span-1 rounded-3xl p-5 bg-white border border-[#e1e2e5] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#532dcf] tracking-widest uppercase mb-1 block">Privacy First</span>
                  <h3 className="font-bold text-base text-[#191c1e]">Zero Surveillance</h3>
                </div>
                <p className="text-xs text-[#484555] flex items-center gap-1.5 mt-2">
                  <Lock className="w-3.5 h-3.5 text-[#532dcf]" />
                  <span>Your location data is yours alone.</span>
                </p>
              </div>

              {/* Card 4: Status Indicator */}
              <div className="col-span-2 rounded-3xl p-5 bg-[#532dcf] text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-bold text-sm">Journey Active & Secure</p>
                    <p className="text-xs text-[#eee7ff]">Proactive grace period check-ins enabled</p>
                  </div>
                </div>
                <button
                  onClick={onStartJourney}
                  className="bg-white text-[#532dcf] text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-100"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
