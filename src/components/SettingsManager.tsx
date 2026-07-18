/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { UserProfile, CloudStorageConfig } from '../types';
import { 
  Sun, Moon, Shield, Key, Mail, CheckCircle2, AlertTriangle, 
  Copy, Download, Cloud, Bell, HelpCircle, ArrowRight, Laptop 
} from 'lucide-react';
import AdPlaceholder from './AdPlaceholder';
import { THEME_PRESETS } from '../App';

interface SettingsManagerProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onShowNotification: (title: string, message: string) => void;
  currentTheme: 'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
  onChangeTheme: (theme: 'blue' | 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate') => void;
}

export default function SettingsManager({ 
  darkMode, 
  setDarkMode, 
  onShowNotification,
  currentTheme,
  onChangeTheme
}: SettingsManagerProps) {
  const [profile, setProfile] = useState<UserProfile>({
    email: 'user@example.com',
    twoFactorEnabled: false,
    offlineMode: false,
  });

  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>({
    googleDrive: { connected: false, email: null, lastBackup: null, autoBackup: false },
    dropbox: { connected: false, email: null, lastBackup: null, autoBackup: false },
  });

  // 2FA Wizard State
  const [twoFactorSetupActive, setTwoFactorSetupActive] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<1 | 2 | 3>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [twoFactorBackupCodes] = useState([
    '7392-4820', '1948-2839', '5820-1049', '9201-4829',
    '3840-2018', '2948-9382', '5830-4928', '8192-3019'
  ]);

  // Cloud Connect Flow state
  const [connectingService, setConnectingService] = useState<'google' | 'dropbox' | null>(null);
  const [selectedCloudEmail, setSelectedCloudEmail] = useState('');
  const [notifPermission, setNotifPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    setProfile(db.getUserProfile());
    setCloudConfig(db.getCloudConfig());
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    db.saveUserProfile(newProfile);
    onShowNotification('Settings Saved', 'Your user configuration was updated.');
  };

  const handleSaveCloudConfig = (updated: Partial<CloudStorageConfig>) => {
    const newConfig = { ...cloudConfig, ...updated };
    setCloudConfig(newConfig);
    db.saveCloudConfig(newConfig);
  };

  // 2FA Flow
  const handleStart2FASetup = () => {
    setTwoFactorSetupActive(true);
    setTwoFactorStep(1);
    setVerificationCode('');
  };

  const handleVerify2FACode = () => {
    if (verificationCode.trim().length === 6) {
      setTwoFactorStep(2);
    } else {
      alert('Please enter a valid 6-digit authentication code.');
    }
  };

  const handleComplete2FA = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      twoFactorEnabled: true,
      twoFactorBackupCodes
    };
    setProfile(updatedProfile);
    db.saveUserProfile(updatedProfile);
    setTwoFactorSetupActive(false);
    onShowNotification('2FA Security Active', 'Two-Factor Authentication is now securing your account.');
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.')) {
      const updatedProfile: UserProfile = {
        ...profile,
        twoFactorEnabled: false,
        twoFactorBackupCodes: undefined
      };
      setProfile(updatedProfile);
      db.saveUserProfile(updatedProfile);
      onShowNotification('2FA Disabled', 'Two-Factor Authentication has been removed.');
    }
  };

  // Simulated Cloud OAuth Integration
  const handleConnectCloud = (service: 'google' | 'dropbox') => {
    setConnectingService(service);
    setSelectedCloudEmail(profile.email);
  };

  const handleConfirmCloudConnect = () => {
    if (!connectingService) return;

    if (connectingService === 'google') {
      handleSaveCloudConfig({
        googleDrive: {
          connected: true,
          email: selectedCloudEmail || 'user.drive@gmail.com',
          lastBackup: null,
          autoBackup: true
        }
      });
      onShowNotification('Google Drive Connected', 'Automatic backups have been enabled for Google Drive.');
    } else {
      handleSaveCloudConfig({
        dropbox: {
          connected: true,
          email: selectedCloudEmail || 'user.dropbox@live.com',
          lastBackup: null,
          autoBackup: true
        }
      });
      onShowNotification('Dropbox Connected', 'Your batch collections will now synchronize to Dropbox.');
    }
    setConnectingService(null);
  };

  const handleDisconnectCloud = (service: 'google' | 'dropbox') => {
    if (window.confirm(`Are you sure you want to disconnect your ${service === 'google' ? 'Google Drive' : 'Dropbox'} account?`)) {
      if (service === 'google') {
        handleSaveCloudConfig({
          googleDrive: { connected: false, email: null, lastBackup: null, autoBackup: false }
        });
      } else {
        handleSaveCloudConfig({
          dropbox: { connected: false, email: null, lastBackup: null, autoBackup: false }
        });
      }
      onShowNotification('Cloud Account Disconnected', `Disassociated cloud integration for ${service === 'google' ? 'Google Drive' : 'Dropbox'}.`);
    }
  };

  const handleRequestPushNotification = () => {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then(permission => {
        setNotifPermission(permission);
        if (permission === 'granted') {
          new Notification('Push Notifications Enabled', {
            body: 'You will now receive desktop notifications for image scraper batches!'
          });
        }
      });
    } else {
      // Direct custom notification
      onShowNotification('Notifications Enabled', 'You will receive notifications within the PicBatch interface.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-security">
      {/* Col 1 & 2: Main Panels */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Panel 1: Theme & Visual Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <span>Visual Customization</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure your viewing mode and layout density for midnight downloads.</p>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dark Interface Mode</span>
                <span className="text-[11px] text-slate-400">Dim the background to preserve visual comfort in low light.</span>
              </div>
              <button
                onClick={handleToggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                  darkMode ? 'bg-brand' : 'bg-slate-200'
                }`}
              >
                <span className="sr-only">Toggle Dark Mode</span>
                <span
                  className={`${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Offline Auto-Sync Mode</span>
                <span className="text-[11px] text-slate-400">Edit, organize, and rename items offline, and sync once connected.</span>
              </div>
              <button
                onClick={() => handleSaveProfile({ offlineMode: !profile.offlineMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                  profile.offlineMode ? 'bg-brand' : 'bg-slate-200'
                }`}
              >
                <span className="sr-only">Toggle Offline Mode</span>
                <span
                  className={`${
                    profile.offlineMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Color Accent Presets */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Color Accent Presets</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(THEME_PRESETS).map((preset) => {
                  const isSelected = currentTheme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onChangeTheme(preset.id);
                        onShowNotification('Theme Applied', `Switched theme accent to ${preset.name}.`);
                      }}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-xs shadow-brand/10' 
                          : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 bg-transparent'
                      }`}
                    >
                      {/* Accent color dot indicator */}
                      <span className={`h-4 w-4 rounded-full ${preset.dotBg} shrink-0 mt-0.5 shadow-xs border border-white dark:border-slate-800`} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                          {preset.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Secure Two-Factor Authentication */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            <span>Two-Factor Authentication (2FA)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Add an extra layer of defense to keep your custom photo collections safe.</p>

          <div className="mt-6">
            {profile.twoFactorEnabled ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Two-Factor Authentication is Active</h4>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-500 mt-0.5">Your scraper folders are protected by an external authenticator.</p>
                  </div>
                </div>
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-white dark:bg-slate-950 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl transition-all shadow-2xs"
                >
                  Disable 2FA
                </button>
              </div>
            ) : !twoFactorSetupActive ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 mt-0.5">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">2FA Setup Available</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Protect account backups and saved assets using any Authenticator app.</p>
                  </div>
                </div>
                <button
                  onClick={handleStart2FASetup}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-xs font-semibold text-white rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Enable 2FA Secure
                </button>
              </div>
            ) : (
              /* 2FA SETUP WIZARD */
              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-bold text-brand dark:text-brand-light uppercase tracking-wide">
                    Step {twoFactorStep} of 3
                  </span>
                  <button 
                    onClick={() => setTwoFactorSetupActive(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Cancel Wizard
                  </button>
                </div>

                {twoFactorStep === 1 && (
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* QR Code Sim */}
                    <div className="w-32 h-32 bg-white p-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-xs flex flex-col items-center justify-center">
                      {/* Generates a simple grid mockup representing QR Code */}
                      <div className="grid grid-cols-6 gap-1 w-full h-full">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`rounded-2xs ${
                              (i % 2 === 0 && i % 3 === 0) || i < 6 || i % 6 === 0 || i > 30
                                ? 'bg-slate-800 dark:bg-slate-900' 
                                : 'bg-transparent'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Scan QR Code</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Open your Google Authenticator or Authy app, tap "+" and scan the code above. Alternatively, use the secret key below:
                      </p>
                      <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                        <span>JBSW Y3DP EHPK 3PXP</span>
                        <Copy className="h-4 w-4 cursor-pointer text-slate-400 hover:text-brand" onClick={() => {
                          navigator.clipboard.writeText('JBSW Y3DP EHPK 3PXP');
                          onShowNotification('Copied', 'Secret key copied to clipboard!');
                        }} />
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification Code</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={6}
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="w-32 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-lg px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-brand"
                          />
                          <button 
                            onClick={handleVerify2FACode}
                            disabled={verificationCode.length !== 6}
                            className="px-4 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-40 text-xs font-bold text-white rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Verify</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {twoFactorStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Save Recovery Codes</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      If you lose access to your device, these backup codes can be used to log in. Keep them in a very safe offline location.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      {twoFactorBackupCodes.map((code, idx) => (
                        <div key={idx} className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-1.5 text-center rounded-md border border-slate-100 dark:border-slate-800/40">
                          {code}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <button 
                        onClick={() => {
                          setCopiedCodes(true);
                          navigator.clipboard.writeText(twoFactorBackupCodes.join('\n'));
                          setTimeout(() => setCopiedCodes(false), 2000);
                        }}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>{copiedCodes ? 'Copied!' : 'Copy Codes'}</span>
                      </button>
                      <button 
                        onClick={() => setTwoFactorStep(3)}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-xs font-semibold text-white rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        I Saved These Codes
                      </button>
                    </div>
                  </div>
                )}

                {twoFactorStep === 3 && (
                  <div className="flex flex-col items-center text-center gap-3 py-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-8 w-8 animate-bounce" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Verification Succeeded</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Two-Factor verification check was successful. Click below to complete the setup.
                    </p>
                    <button 
                      onClick={handleComplete2FA}
                      className="mt-2 px-6 py-2 bg-brand hover:bg-brand-hover text-xs font-semibold text-white rounded-xl shadow-md cursor-pointer"
                    >
                      Activate 2FA Secure
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Cloud Integrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Cloud className="h-5 w-5 text-indigo-500" />
            <span>Cloud Integrations & Backups</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Connect third-party accounts for automated background backups and cross-platform syncing.</p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Google Drive Card */}
            <div className="flex-1 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Google Drive</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    cloudConfig.googleDrive.connected 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {cloudConfig.googleDrive.connected ? 'Connected' : 'Offline'}
                  </span>
                </div>
                {cloudConfig.googleDrive.connected ? (
                  <p className="text-xs text-slate-400 mt-2">
                    Account: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{cloudConfig.googleDrive.email}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">Sync batches, compressed files, and ZIP folders safely.</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                {cloudConfig.googleDrive.connected ? (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cloudConfig.googleDrive.autoBackup}
                        onChange={(e) => handleSaveCloudConfig({
                          googleDrive: { ...cloudConfig.googleDrive, autoBackup: e.target.checked }
                        })}
                        className="rounded-xs border-slate-300 focus:ring-brand cursor-pointer"
                      />
                      <span>Auto Backup</span>
                    </label>
                    <button 
                      onClick={() => handleDisconnectCloud('google')}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleConnectCloud('google')}
                    className="w-full py-1.5 text-center border border-brand hover:bg-brand/10 rounded-xl text-xs font-semibold text-brand transition-all cursor-pointer"
                  >
                    Connect Drive
                  </button>
                )}
              </div>
            </div>

            {/* Dropbox Card */}
            <div className="flex-1 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Dropbox</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    cloudConfig.dropbox.connected 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {cloudConfig.dropbox.connected ? 'Connected' : 'Offline'}
                  </span>
                </div>
                {cloudConfig.dropbox.connected ? (
                  <p className="text-xs text-slate-400 mt-2">
                    Account: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{cloudConfig.dropbox.email}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">Upload archives to your secure Dropbox storage folder.</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                {cloudConfig.dropbox.connected ? (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cloudConfig.dropbox.autoBackup}
                        onChange={(e) => handleSaveCloudConfig({
                          dropbox: { ...cloudConfig.dropbox, autoBackup: e.target.checked }
                        })}
                        className="rounded-xs border-slate-300 focus:ring-brand cursor-pointer"
                      />
                      <span>Auto Backup</span>
                    </label>
                    <button 
                      onClick={() => handleDisconnectCloud('dropbox')}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleConnectCloud('dropbox')}
                    className="w-full py-1.5 text-center border border-brand hover:bg-brand/10 rounded-xl text-xs font-semibold text-brand transition-all cursor-pointer"
                  >
                    Connect Dropbox
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Notification Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            <span>Instant Alerts & Notification Rules</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Get real-time updates when heavy download batches or compression finishes.</p>

          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Desktop Push Alerts</span>
              <span className="text-xs text-slate-400">Current state: <span className="font-bold text-slate-600 dark:text-slate-300 font-mono">{notifPermission}</span></span>
            </div>
            <button 
              onClick={handleRequestPushNotification}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white rounded-xl transition-all shadow-sm"
            >
              Trigger Permission Request
            </button>
          </div>
        </div>

      </div>

      {/* Col 3: Sidebar Ads & Secondary Info */}
      <div className="flex flex-col gap-6">
        <AdPlaceholder slot="5829104" format="sidebar" />
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-brand" />
            <span>Developer Note</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All image resizing, file conversions, and zip creation occur securely in your browser's sandboxed environment.
          </p>
          <div className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col gap-1 leading-normal">
            <div>CORS Bypassing Server: Active</div>
            <div>Scraper API Route: /api/scrape</div>
            <div>Proxy Engine: /api/proxy-image</div>
          </div>
        </div>

        <AdPlaceholder slot="9483021" format="banner" />
      </div>

      {/* OVERLAY: Simulated Cloud Auth Modal */}
      {connectingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 rounded-xl text-brand">
                <Cloud className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
                Connect {connectingService === 'google' ? 'Google Account' : 'Dropbox Account'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Please grant PicBatch permission to create, access, and update its own folders to save zip archives automatically.
            </p>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Authorize Email Address</label>
              <input 
                type="email"
                value={selectedCloudEmail}
                onChange={(e) => setSelectedCloudEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-brand font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={() => setConnectingService(null)}
                className="py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              >
                Refuse
              </button>
              <button 
                onClick={handleConfirmCloudConnect}
                className="py-2.5 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                Authorize Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
