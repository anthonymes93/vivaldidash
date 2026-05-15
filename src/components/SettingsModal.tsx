import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Timer, Layers, Plus, Check, Settings2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridColumns: number;
  onGridColumnsChange: (cols: number) => void;
  showGoalMarquee: boolean;
  onShowGoalMarqueeChange: (show: boolean) => void;
  goalMarqueeInterval: number;
  onGoalMarqueeIntervalChange: (interval: number) => void;
  goalMarqueeRepeatCount: number;
  onGoalMarqueeRepeatCountChange: (count: number) => void;
  widgetPauseMins: number;
  onWidgetPauseMinsChange: (mins: number) => void;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  useQuickNoteOnHover: boolean;
  onUseQuickNoteOnHoverChange: (val: boolean) => void;
}

type Tab = 'layout' | 'widget' | 'workspaces';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'layout',     label: 'Layout',     icon: <LayoutGrid size={15} /> },
  { id: 'widget',     label: 'Widget',     icon: <Timer size={15} /> },
  { id: 'workspaces', label: 'Workspaces', icon: <Layers size={15} /> },
];

/* ── Reusable sub-components ───────────────────────────────────────── */
const SectionCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '20px',
    ...style,
  }}>
    {children}
  </div>
);

const SettingRow: React.FC<{ label: string; hint?: string; value?: React.ReactNode; children?: React.ReactNode }> = ({ label, hint, value, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{hint}</div>}
      </div>
      {value && <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-color)', flexShrink: 0, marginLeft: '12px' }}>{value}</span>}
    </div>
    {children}
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <div
    onClick={() => onChange(!value)}
    style={{
      width: '44px', height: '26px', borderRadius: '13px', flexShrink: 0,
      background: value ? 'var(--accent-color)' : 'rgba(255,255,255,0.12)',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.25s',
      boxShadow: value ? '0 0 12px rgba(124,77,255,0.4)' : 'none',
    }}
  >
    <motion.div
      animate={{ x: value ? 20 : 2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 400 }}
      style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
    />
  </div>
);

const Slider: React.FC<{ min: number; max: number; step?: number; value: number; onChange: (v: number) => void; leftLabel?: string; rightLabel?: string }> = ({ min, max, step = 1, value, onChange, leftLabel, rightLabel }) => (
  <div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer', height: '4px' }}
    />
    {(leftLabel || rightLabel) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    )}
  </div>
);

const Divider = () => <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />;

/* ── Main Component ────────────────────────────────────────────────── */
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose,
  gridColumns, onGridColumnsChange,
  showGoalMarquee, onShowGoalMarqueeChange,
  goalMarqueeInterval, onGoalMarqueeIntervalChange,
  goalMarqueeRepeatCount, onGoalMarqueeRepeatCountChange,
  widgetPauseMins, onWidgetPauseMinsChange,
  workspaces = [], activeWorkspaceId,
  onWorkspaceChange, onCreateWorkspace,
  useQuickNoteOnHover, onUseQuickNoteOnHoverChange,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('layout');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim() && onCreateWorkspace) {
      onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
    }
  };

  const fmtInterval = (s: number) =>
    s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '480px',
              background: 'rgba(18,18,24,0.92)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: '24px 24px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(124,77,255,0.15)', border: '1px solid rgba(124,77,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings2 size={17} color="var(--accent-color)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Settings</h2>
                  <p style={{ fontSize: '11px', opacity: 0.35, margin: 0 }}>Dashboard preferences</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                <X size={16} color="rgba(255,255,255,0.5)" />
              </motion.button>
            </div>

            {/* ── Tabs ── */}
            <div style={{ padding: '16px 24px 0', display: 'flex', gap: '4px' }}>
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: '9px 8px',
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? 'rgba(124,77,255,0.18)' : 'rgba(255,255,255,0.04)',
                    color: activeTab === tab.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '12px', fontWeight: activeTab === tab.id ? 600 : 400,
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* ── Scrollable content ── */}
            <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="wait" initial={false}>

                {/* ── LAYOUT TAB ── */}
                {activeTab === 'layout' && (
                  <motion.div key="layout" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <SectionCard>
                      <SettingRow
                        label="Grid Columns"
                        hint="Number of bookmark columns on the dashboard"
                        value={gridColumns}
                      >
                        <Slider min={4} max={12} value={gridColumns} onChange={onGridColumnsChange} leftLabel="Spacious (4)" rightLabel="Compact (12)" />
                      </SettingRow>
                    </SectionCard>

                    <SectionCard>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <SettingRow label="Goal Marquee" hint="Show scrolling goal text on the dashboard" />
                          <Toggle value={showGoalMarquee} onChange={onShowGoalMarqueeChange} />
                        </div>

                        <AnimatePresence>
                          {showGoalMarquee && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px' }}
                            >
                              <Divider />
                              <SettingRow label="Cycle Interval" value={fmtInterval(goalMarqueeInterval)}>
                                <Slider
                                  min={10} max={3600}
                                  step={goalMarqueeInterval < 60 ? 5 : goalMarqueeInterval < 300 ? 10 : 60}
                                  value={goalMarqueeInterval}
                                  onChange={onGoalMarqueeIntervalChange}
                                  leftLabel="10s" rightLabel="1h"
                                />
                              </SettingRow>
                              <Divider />
                              <SettingRow label="Repeats per Cycle" value={`${goalMarqueeRepeatCount}×`}>
                                <Slider min={1} max={10} value={goalMarqueeRepeatCount} onChange={onGoalMarqueeRepeatCountChange} leftLabel="1×" rightLabel="10×" />
                              </SettingRow>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </SectionCard>

                    <SectionCard>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <SettingRow label="Quick Note on Hover" hint="Show a short note when hovering over items" />
                        <Toggle value={useQuickNoteOnHover} onChange={onUseQuickNoteOnHoverChange} />
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── WIDGET TAB ── */}
                {activeTab === 'widget' && (
                  <motion.div key="widget" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <SectionCard>
                      <SettingRow
                        label="Pause Duration"
                        hint="How long the calendar widget pauses auto-rotation when you click the pause button"
                        value={`${widgetPauseMins} min`}
                      >
                        <Slider min={1} max={60} value={widgetPauseMins} onChange={onWidgetPauseMinsChange} leftLabel="1 min" rightLabel="60 min" />
                      </SettingRow>
                    </SectionCard>

                    {/* Quick preview of pause presets */}
                    <SectionCard>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Presets</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[5, 10, 15, 30, 60].map(m => (
                          <motion.button
                            key={m}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onWidgetPauseMinsChange(m)}
                            style={{
                              padding: '7px 14px', borderRadius: '10px', border: '1px solid',
                              borderColor: widgetPauseMins === m ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
                              background: widgetPauseMins === m ? 'rgba(124,77,255,0.18)' : 'rgba(255,255,255,0.04)',
                              color: widgetPauseMins === m ? 'var(--accent-color)' : 'rgba(255,255,255,0.55)',
                              fontSize: '12px', fontWeight: widgetPauseMins === m ? 700 : 400,
                              cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            {widgetPauseMins === m && <Check size={11} />}
                            {m} min
                          </motion.button>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ── WORKSPACES TAB ── */}
                {activeTab === 'workspaces' && (
                  <motion.div key="workspaces" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {workspaces.length > 0 ? (
                      <SectionCard>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Your Workspaces
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {workspaces.map(ws => {
                            const active = ws.id === activeWorkspaceId;
                            return (
                              <motion.div
                                key={ws.id}
                                whileHover={{ x: 2 }}
                                onClick={() => onWorkspaceChange && onWorkspaceChange(ws.id)}
                                style={{
                                  padding: '12px 14px', borderRadius: '12px',
                                  background: active ? 'rgba(124,77,255,0.15)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${active ? 'rgba(124,77,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)' }}>
                                  {ws.name}
                                </span>
                                {active && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--accent-color)', fontWeight: 600 }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                                    Active
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </SectionCard>
                    ) : (
                      <SectionCard>
                        <p style={{ fontSize: '13px', opacity: 0.35, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>No workspaces yet</p>
                      </SectionCard>
                    )}

                    <SectionCard>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        New Workspace
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Workspace name…"
                          value={newWorkspaceName}
                          onChange={e => setNewWorkspaceName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
                          style={{
                            flex: 1, padding: '10px 14px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.9)', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCreateWorkspace}
                          disabled={!newWorkspaceName.trim()}
                          style={{
                            padding: '0 16px', borderRadius: '12px', border: 'none',
                            background: newWorkspaceName.trim() ? 'var(--accent-color)' : 'rgba(255,255,255,0.06)',
                            color: newWorkspaceName.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                            fontSize: '13px', fontWeight: 600, cursor: newWorkspaceName.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', flexShrink: 0,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Plus size={14} /> Create
                        </motion.button>
                      </div>
                    </SectionCard>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{
                  padding: '10px 24px', borderRadius: '12px', border: 'none',
                  background: 'var(--accent-color)',
                  boxShadow: '0 4px 20px rgba(124,77,255,0.35)',
                  color: 'white', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
