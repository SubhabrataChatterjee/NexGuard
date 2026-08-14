import React, { useEffect, useState } from "react";

import { Navbar } from "./components/Navbar";
import { HeroLanding } from "./components/HeroLanding";
import { AuthModal } from "./components/AuthModal";
import { OnboardingPermissions } from "./components/OnboardingPermissions";
import { DashboardView } from "./components/DashboardView";
import { StartJourneyModal } from "./components/StartJourneyModal";
import { ActiveJourneyView } from "./components/ActiveJourneyView";
import { SafetyCheckModal } from "./components/SafetyCheckModal";
import { SosActiveView } from "./components/SosActiveView";
import { TrustedContactsView } from "./components/TrustedContactsView";
import { EmergencyResourcesView } from "./components/EmergencyResourcesView";
import { JourneyHistoryView } from "./components/JourneyHistoryView";
import { PrivacySettingsView } from "./components/PrivacySettingsView";
import { AdminView } from "./components/AdminView";
import { AssistantDrawer } from "./components/AssistantDrawer";

import { api } from "./lib/api";

import type {
  User,
  UserSettings,
  Journey,
  TrustedContact,
  SosEvent,
  NotificationItem,
} from "./types";

export function App() {
  // ============================================================
  // USER / AUTH STATE
  // ============================================================

  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // ============================================================
  // NAVIGATION STATE
  // ============================================================

  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // ============================================================
  // APPLICATION DATA
  // ============================================================

  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);

  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ============================================================
  // MODAL / DRAWER STATE
  // ============================================================

  const [showStartJourneyModal, setShowStartJourneyModal] =
    useState<boolean>(false);

  const [showOnboardingModal, setShowOnboardingModal] =
    useState<boolean>(false);

  const [showSafetyCheckModal, setShowSafetyCheckModal] =
    useState<boolean>(false);

  const [showAssistantDrawer, setShowAssistantDrawer] =
    useState<boolean>(false);

  // ============================================================
  // LOADING STATE
  // ============================================================

  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // ============================================================
  // REFRESH USER DATA
  // ============================================================

  const refreshUserData = async (): Promise<void> => {
    try {
      const [
        activeJourneyData,
        activeSosData,
        contactsData,
        journeysData,
        notificationsData,
      ] = await Promise.all([
        api.getActiveJourney(),
        api.getActiveSos(),
        api.getTrustedContacts(),
        api.getJourneys(),
        api.getNotifications(),
      ]);

      setActiveJourney(activeJourneyData);
      setActiveSos(activeSosData);
      setTrustedContacts(contactsData);
      setRecentJourneys(journeysData);
      setNotifications(notificationsData);

      // If an SOS is active, always show the SOS screen.
      if (activeSosData) {
        setCurrentTab("sos");
      } else if (activeJourneyData && currentTab === "hero") {
        setCurrentTab("journey");
      }
    } catch (error) {
      console.error("❌ Data refresh error:", error);
    }
  };

  // ============================================================
  // INITIALIZE APPLICATION SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const initApp = async (): Promise<void> => {
      const token = localStorage.getItem("nexguard_token");

      // No saved login session.
      if (!token) {
        if (!mounted) return;

        setUser(null);
        setSettings(null);
        setInitialLoading(false);
        setCurrentTab("hero");

        return;
      }

      try {
        const { user: meUser, settings: meSettings } = await api.getMe();

        if (!mounted) return;

        setUser(meUser);
        setSettings(meSettings);

        await refreshUserData();
      } catch (error) {
        console.error("❌ Session initialization failed:", error);

        // Token is invalid/expired.
        localStorage.removeItem("nexguard_token");

        if (!mounted) return;

        setUser(null);
        setSettings(null);
        setActiveJourney(null);
        setActiveSos(null);
        setTrustedContacts([]);
        setRecentJourneys([]);
        setNotifications([]);

        setCurrentTab("hero");
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    void initApp();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // AUTH SUCCESS
  // ============================================================

  const handleAuthSuccess = async (
    authenticatedUser: User,
    authenticatedSettings: UserSettings
  ): Promise<void> => {
    setUser(authenticatedUser);
    setSettings(authenticatedSettings);

    setShowOnboardingModal(true);

    await refreshUserData();

    setCurrentTab("dashboard");
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      localStorage.removeItem("nexguard_token");

      setUser(null);
      setSettings(null);

      setActiveJourney(null);
      setActiveSos(null);

      setTrustedContacts([]);
      setRecentJourneys([]);
      setNotifications([]);

      setShowStartJourneyModal(false);
      setShowOnboardingModal(false);
      setShowSafetyCheckModal(false);
      setShowAssistantDrawer(false);

      setCurrentTab("hero");
    }
  };

  // ============================================================
  // START JOURNEY
  // ============================================================

  const handleStartJourney = async (journeyData: {
    destination_name: string;
    expected_arrival_minutes: number;
    grace_period_minutes: number;
    trusted_contact_ids: string[];
  }): Promise<void> => {
    try {
      const newJourney = await api.createJourney(journeyData);

      setActiveJourney(newJourney);
      setShowStartJourneyModal(false);
      setCurrentTab("journey");

      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to start journey:", error);
    }
  };

  // ============================================================
  // COMPLETE JOURNEY
  // ============================================================

  const handleCompleteJourney = async (): Promise<void> => {
    if (!activeJourney) return;

    try {
      await api.completeJourney(activeJourney.id);

      setActiveJourney(null);
      setCurrentTab("dashboard");

      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to complete journey:", error);
    }
  };

  // ============================================================
  // TRIGGER SOS
  // ============================================================

  const handleTriggerSos = async (): Promise<void> => {
    try {
      const sos = await api.triggerSos({});

      setActiveSos(sos);
      setShowSafetyCheckModal(false);
      setCurrentTab("sos");

      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to trigger SOS:", error);
    }
  };

  // ============================================================
  // CANCEL SOS
  // ============================================================

  const handleCancelSos = async (reason?: string): Promise<void> => {
    if (!activeSos) return;

    try {
      await api.cancelSos(activeSos.id, reason);

      setActiveSos(null);
      setCurrentTab("dashboard");

      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to cancel SOS:", error);
    }
  };

  // ============================================================
  // SAFETY CHECK — SAFE
  // ============================================================

  const handleRespondCheckSafe = async (): Promise<void> => {
    if (!activeJourney) return;

    try {
      await api.respondSafetyCheck(activeJourney.id, "SAFE");

      setShowSafetyCheckModal(false);

      await refreshUserData();
    } catch (error) {
      console.error("❌ Failed to respond to safety check:", error);
    }
  };

  // ============================================================
  // SAFETY CHECK — NEED HELP
  // ============================================================

  const handleRespondCheckNeedHelp = async (): Promise<void> => {
    if (!activeJourney) return;

    try {
      const response = await api.respondSafetyCheck(
        activeJourney.id,
        "NEED_HELP"
      );

      if (response.sosEvent) {
        setActiveSos(response.sosEvent);
        setCurrentTab("sos");
      }

      setShowSafetyCheckModal(false);

      await refreshUserData();
    } catch (error) {
      console.error(
        "❌ Failed to respond to safety check:",
        error
      );
    }
  };

  // ============================================================
  // INITIAL LOADING SCREEN
  // ============================================================

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#532dcf] border-t-transparent animate-spin" />

          <p className="text-sm font-bold text-[#532dcf] tracking-wide">
            Initializing NexGuard...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ACTIVE SOS SCREEN
  // ============================================================

  if (activeSos || currentTab === "sos") {
    const fallbackSosEvent: SosEvent = {
      id: "temp-sos",
      user_id: user?.id || "demo",
      journey_id: activeJourney?.id || null,
      trigger_type: "MANUAL_SOS",
      status: "ACTIVE",
      activated_at: new Date().toISOString(),
      resolved_at: null,
      latitude: 22.5726,
      longitude: 88.3639,
      location_name:
        activeJourney?.destination_name ||
        "Kolkata, West Bengal, India",
      battery_percent: 82,

      notified_contacts: trustedContacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        status: "DELIVERED",
      })),

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return (
      <SosActiveView
        sosEvent={activeSos || fallbackSosEvent}
        onCancelSos={handleCancelSos}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    );
  }

  // ============================================================
  // PUBLIC LANDING PAGE
  // ============================================================

  if (currentTab === "hero" && !user) {
    return (
      <HeroLanding
        onStartJourney={() => setCurrentTab("auth")}
        onLearnMore={() => setCurrentTab("auth")}
        onSignIn={() => setCurrentTab("auth")}
      />
    );
  }

  // ============================================================
  // AUTH SCREEN
  // ============================================================

  if (currentTab === "auth" && !user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  // ============================================================
  // MAIN APPLICATION
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#191c1e] flex flex-col md:flex-row font-sans">

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        user={user}
        onLogout={handleLogout}
        onOpenSos={handleTriggerSos}
        onOpenAssistant={() => setShowAssistantDrawer(true)}
        locationSharingActive={Boolean(activeJourney)}
        unreadCount={notifications.filter(
          (notification) => !notification.read_at
        ).length}
      />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="flex-1 md:ml-[280px] p-4 md:p-8 overflow-y-auto">

        {/* DASHBOARD */}

        {currentTab === "dashboard" && (
          <DashboardView
            user={user}
            activeJourney={activeJourney}
            recentJourneys={recentJourneys}
            onStartJourneyClick={() =>
              setShowStartJourneyModal(true)
            }
            onOpenSos={handleTriggerSos}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onOpenAssistant={() =>
              setShowAssistantDrawer(true)
            }
          />
        )}

        {/* ACTIVE JOURNEY */}

        {currentTab === "journey" &&
          (activeJourney ? (
            <ActiveJourneyView
              journey={activeJourney}
              onComplete={handleCompleteJourney}
              onTriggerSos={handleTriggerSos}
              onTriggerSafetyCheck={() =>
                setShowSafetyCheckModal(true)
              }
            />
          ) : (
            <div className="space-y-6 max-w-[1000px] mx-auto text-center py-12">
              <div className="bg-white rounded-3xl p-12 border border-[#e1e2e5] shadow-sm space-y-4">

                <h2 className="text-2xl font-bold text-[#191c1e]">
                  No Active Safe Journey
                </h2>

                <p className="text-sm text-[#797586] max-w-md mx-auto">
                  Start a journey session to enable live location
                  sharing with your trusted contacts and proactive
                  check-ins.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowStartJourneyModal(true)
                  }
                  className="bg-[#532dcf] hover:bg-[#481cc4] text-white font-bold py-3.5 px-8 rounded-2xl shadow transition-all text-sm"
                >
                  START SAFE JOURNEY
                </button>

              </div>
            </div>
          ))}

        {/* TRUSTED CONTACTS */}

        {currentTab === "contacts" && (
          <TrustedContactsView
            contacts={trustedContacts}
            onRefresh={refreshUserData}
          />
        )}

        {/* EMERGENCY RESOURCES */}

        {currentTab === "resources" && (
          <EmergencyResourcesView />
        )}

        {/* JOURNEY HISTORY */}

        {currentTab === "history" && (
          <JourneyHistoryView journeys={recentJourneys} />
        )}

        {/* PRIVACY */}

        {currentTab === "privacy" && (
          <PrivacySettingsView
            user={user}
            settings={settings}
            onRefresh={refreshUserData}
          />
        )}

        {/* ADMIN */}

        {currentTab === "admin" && <AdminView />}
      </main>

      {/* ======================================================
          START JOURNEY MODAL
      ====================================================== */}

      {showStartJourneyModal && (
        <StartJourneyModal
          trustedContacts={trustedContacts}
          onStart={handleStartJourney}
          onClose={() =>
            setShowStartJourneyModal(false)
          }
        />
      )}

      {/* ======================================================
          ONBOARDING PERMISSIONS
      ====================================================== */}

      {showOnboardingModal && (
        <OnboardingPermissions
          onComplete={() =>
            setShowOnboardingModal(false)
          }
        />
      )}

      {/* ======================================================
          SAFETY CHECK MODAL
      ====================================================== */}

      {showSafetyCheckModal && (
        <SafetyCheckModal
          onRespondSafe={handleRespondCheckSafe}
          onRespondNeedHelp={handleRespondCheckNeedHelp}
        />
      )}

      {/* ======================================================
          AI ASSISTANT
      ====================================================== */}

      <AssistantDrawer
        isOpen={showAssistantDrawer}
        onClose={() =>
          setShowAssistantDrawer(false)
        }
      />
    </div>
  );
}

export default App;

