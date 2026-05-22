'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/workout/dashboard';
import { HistoryCalendar } from '@/components/workout/history-calendar';
import { EquipmentModal } from '@/components/workout/equipment-modal';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import { useEquipmentStorage } from '@/hooks/useEquipmentStorage';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Dumbbell, Moon, Sun, RotateCcw } from 'lucide-react';

type Tab = 'today' | 'history' | 'equipment';

export default function Home() {
  const [tab, setTab] = useState<Tab>('today');
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { clearAll: clearWorkouts } = useWorkoutStorage();
  const { clearAll: clearEquipment } = useEquipmentStorage();

  // Handle theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      clearWorkouts();
      clearEquipment();
      setTab('today');
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="px-4 py-4 max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Pure Flow</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {tab === 'today' && <Dashboard onEquipmentModalOpen={() => setEquipmentModalOpen(true)} />}
        {tab === 'history' && <HistoryCalendar />}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur border-t border-border">
        <div className="px-4 py-3 max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Tab Buttons */}
          <button
            onClick={() => setTab('today')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              tab === 'today' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              tab === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Equipment Modal Trigger */}
          <Button
            onClick={() => setEquipmentModalOpen(true)}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 flex gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Equipment</span>
          </Button>

          {/* Reset Button */}
          <button
            onClick={handleResetData}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Reset all data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Equipment Modal */}
      <EquipmentModal open={equipmentModalOpen} onOpenChange={setEquipmentModalOpen} />
    </main>
  );
}
