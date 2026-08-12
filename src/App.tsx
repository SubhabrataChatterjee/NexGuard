import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { AuthModal } from './components/AuthModal';
import { OnboardingPermissions } from './components/OnboardingPermissions';
import { DashboardView } from './components/DashboardView';
import { StartJourneyModal } from './components/StartJourneyModal';
import { ActiveJourneyView } from './components/ActiveJourneyView';
import { SafetyCheckModal } from './components/SafetyCheckModal';
import { SosActiveView } from './components/SosActiveView';
import { TrustedContactsView } from './components/TrustedContactsView';
import { EmergencyResourcesView } from './components/EmergencyResourcesView';
import { JourneyHistoryView } from './components/JourneyHistoryView';
import { PrivacySettingsView } from './components/PrivacySettingsView';
import { AdminView } from './components/AdminView';
import { AssistantDrawer } from './components/AssistantDrawer';
import { api } from './lib/api';
import { User, UserSettings, Journey, TrustedContact, SosEvent, NotificationItem } from './types';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);
  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showSafetyCheckModal, setShowSafetyCheckModal] = useState(false);
  const [showAssistantDrawer, setShowAssistantDrawer] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize session & load user data
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('nexguard_token');
      if (!token) {
        setInitialLoading(false);
        setCurrentTab('hero');
        return;
      }

      try {
        const { user: meUser, settings: meSettings } = await api.getMe();
        setUser(meUser);
        setSettings(meSettings);

        // Load application datasets
        await refreshUserData();
      } catch (err) {
        console.error('Session restoration error:', err);
        localStorage.removeItem('nexguard_token');
        setCurrentTab('hero');
      } finally {
        setInitialLoading(false);
      }
    };

    initApp();
  }, []);

  const refreshUserData = async () => {
    try {
      const [activeJ, activeS, contactsData, journeysData, notifsData] = await Promise.all([
        api.getActiveJourney(),
        api.getActiveSos(),
        api.getTrustedContacts(),
        api.getJourneys(),
        api.getNotifications(),
      ]);

      setActiveJourney(activeJ);
      setActiveSos(activeS);
      setTrustedContacts(contactsData);
      setRecentJourneys(journeysData);
      setNotifications(notifsData);

      if (activeS) {
        setCurrentTab('sos');
      } else if (activeJ && currentTab === 'hero') {
        setCurrentTab('journey');
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = async (u: User, s: UserSettings) => {
    setUser(u);
    setSettings(s);
    setShowOnboardingModal(true);
    await refreshUserData();
    setCurrentTab('dashboard');
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setSettings(null);
    setActiveJourney(null);
    setActiveSos(null);
    setCurrentTab('hero');
  };

  // Start Journey
  const handleStartJourney = async (journeyData: {
    destination_name: string;
    expected_arrival_minutes: number;
    grace_period_minutes: number;
    trusted_contact_ids: string[];
  }) => {
    const newJourney = await api.createJourney(journeyData);
    setActiveJourney(newJourney);
    setShowStartJourneyModal(false);
    setCurrentTab('journey');
    await refreshUserData();
  };

  // Complete Journey
  const handleCompleteJourney = async () => {
    if (!activeJourney) return;
    await api.completeJourney(activeJourney.id);
    setActiveJourney(null);
    setCurrentTab('dashboard');
    await refreshUserData();
  };

  // Trigger SOS Emergency
  const handleTriggerSos = async () => {
    const sos = await api.triggerSos({});
    setActiveSos(sos);
    setCurrentTab('sos');
    setShowSafetyCheckModal(false);
    await refreshUserData();
  };

  // Cancel SOS
  const handleCancelSos = async (reason?: string) => {
    if (!activeSos) return;
    await api.cancelSos(activeSos.id, reason);
    setActiveSos(null);
    setCurrentTab('dashboard');
    await refreshUserData();
  };

  // Safety Check responses
  const handleRespondCheckSafe = async () => {
    if (!activeJourney) return;
    await api.respondSafetyCheck(activeJourney.id, 'SAFE');
    setShowSafetyCheckModal(false);
    await refreshUserData();
  };

  const handleRespondCheckNeedHelp = async () => {
    if (!activeJourney) return;
    const res = await api.respondSafetyCheck(activeJourney.id, 'NEED_HELP');
    if (res.sosEvent) {
      setActiveSos(res.sosEvent);
      setCurrentTab('sos');
    }
    setShowSafetyCheckModal(false);
    await refreshUserData();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#532dcf] border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-[#532dcf] tracking-wide">Initializing NexGuard...</p>
        </div>
      </div>
    );
  }

  // Active SOS High Priority Screen
  if (activeSos || currentTab === 'sos') {
    return (
      <SosActiveView
        sosEvent={
          activeSos || {
            id: 'temp-sos',
            user_id: user?.id || 'demo',
            journey_id: activeJourney?.id || null,
            trigger_type: 'MANUAL_SOS',
            status: 'ACTIVE',
            activated_at: new Date().toISOString(),
            resolved_at: null,
            latitude: 22.5726,
            longitude: 88.3639,
            location_name: activeJourney?.destination_name || 'Kolkata, West Bengal, India',
            battery_percent: 82,
            notified_contacts: trustedContacts.map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              status: 'DELIVERED',
            })),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        onCancelSos={handleCancelSos}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    );
  }

  // Unauthenticated Hero Landing View
  if (currentTab === 'hero' && !user) {
    return (
      <HeroLanding
        onStartJourney={() => setCurrentTab('auth')}
        onLearnMore={() => setCurrentTab('auth')}
        onSignIn={() => setCurrentTab('auth')}
      />
    );
  }

  // Auth Screen
  if (currentTab === 'auth' && !user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#191c1e] flex flex-col md:flex-row font-sans">
      {/* Shell Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        user={user}
        onLogout={handleLogout}
        onOpenSos={handleTriggerSos}
        onOpenAssistant={() => setShowAssistantDrawer(true)}
        locationSharingActive={!!activeJourney}
        unreadCount={notifications.filter((n) => !n.read_at).length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 md:ml-[280px] p-4 md:p-8 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <DashboardView
            user={user}
            activeJourney={activeJourney}
            recentJourneys={recentJourneys}
            onStartJourneyClick={() => setShowStartJourneyModal(true)}
            onOpenSos={handleTriggerSos}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onOpenAssistant={() => setShowAssistantDrawer(true)}
          />
        )}

        {currentTab === 'journey' && (
          activeJourney ? (
            <ActiveJourneyView
              journey={activeJourney}
              onComplete={handleCompleteJourney}
              onTriggerSos={handleTriggerSos}
              onTriggerSafetyCheck={() => setShowSafetyCheckModal(true)}
            />
          ) : (
            <div className="space-y-6 max-w-[1000px] mx-auto text-center py-12">
              <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] shadow-sm space-y-4">
                <h2 className="text-2xl font-bold text-[#191c1e]">No Active Safe Journey</h2>
                <p className="text-sm text-[#797586] max-w-md mx-auto">
                  Start a journey session to enable live location sharing with your trusted contacts and proactive check-ins.
                </p>
                <button
                  onClick={() => setShowStartJourneyModal(true)}
                  className="bg-[#532dcf] hover:bg-[#481cc4] text-white font-bold py-3.5 px-8 rounded-2xl shadow transition-all text-sm"
                >
                  START SAFE JOURNEY
                </button>
              </div>
            </div>
          )
        )}

        {currentTab === 'contacts' && (
          <TrustedContactsView contacts={trustedContacts} onRefresh={refreshUserData} />
        )}

        {currentTab === 'resources' && <EmergencyResourcesView />}

        {currentTab === 'history' && <JourneyHistoryView journeys={recentJourneys} />}

        {currentTab === 'privacy' && (
          <PrivacySettingsView user={user} settings={settings} onRefresh={refreshUserData} />
        )}

        {currentTab === 'admin' && <AdminView />}
      </main>

      {/* Start Journey Modal */}
      {showStartJourneyModal && (
        <StartJourneyModal
          trustedContacts={trustedContacts}
          onStart={handleStartJourney}
          onClose={() => setShowStartJourneyModal(false)}
        />
      )}

      {/* Onboarding Permissions Modal */}
      {showOnboardingModal && (
        <OnboardingPermissions onComplete={() => setShowOnboardingModal(false)} />
      )}

      {/* Safety Check Countdown Modal */}
      {showSafetyCheckModal && (
        <SafetyCheckModal
          onRespondSafe={handleRespondCheckSafe}
          onRespondNeedHelp={handleRespondCheckNeedHelp}
        />
      )}

      {/* AI Assistant Chat Drawer */}
      <AssistantDrawer
        isOpen={showAssistantDrawer}
        onClose={() => setShowAssistantDrawer(false)}
      />
    </div>
  );
}
export default App;
