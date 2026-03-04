import { useState, useEffect } from 'react';
import { type User, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { LogOut, Settings, Plus, Play, MoreVertical, Trash2, Edit2, FileText, X, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { profileService } from '../services/profileService';
import { settingsService } from '../services/settingsService';
import { getRecentSessions } from '../services/sessionService';
import type { ChildProfile, ParentSettings } from '../types';
import ProfileModal from '../components/ProfileModal';

interface DashboardProps {
  user: User;
}

export default function DashboardPage({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);

  // Settings state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<ParentSettings>({ voiceName: 'Puck' });

  // Popover state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Report State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [activeProfileForReport, setActiveProfileForReport] = useState<ChildProfile | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfiles(user.uid);
      setProfiles(data);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const settings = await settingsService.getSettings(user.uid);
      setCurrentSettings(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchSettings();
  }, [user.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleOpenAdd = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = () => {
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async (settings: ParentSettings) => {
    try {
      await settingsService.updateSettings(user.uid, settings);
      setCurrentSettings(settings);
      setSettingsModalOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleOpenEdit = (profile: ChildProfile) => {
    setEditingProfile(profile);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (profileData: Omit<ChildProfile, 'profile_id' | 'parent_uid' | 'createdAt'>, profileId?: string) => {
    if (profileId) {
      await profileService.updateProfile(profileId, profileData);
    } else {
      await profileService.createProfile(user.uid, profileData);
    }
    await fetchProfiles();
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este perfil? Esta acción no se puede deshacer.')) {
      setOpenMenuId(null);
      await profileService.deleteProfile(profileId);
      await fetchProfiles();
    }
  };

  const handleGenerateReport = async (profile: ChildProfile, timeRange: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
    setActiveProfileForReport(profile);
    setReportModalOpen(true);
    setReportLoading(true);
    setCurrentReport(null);

    try {
      if (!profile.profile_id) throw new Error("No profile id");
      const sessions = await getRecentSessions(profile.profile_id, 20);

      const response = await fetch('http://localhost:8080/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: profile.profile_id,
          timeRange,
          language: profile.ai_tutor.language,
          sessions
        })
      });
      const data = await response.json();
      if (data.report) {
        setCurrentReport(data.report);
      } else {
        setCurrentReport({ error: "Hubo un problema generando el reporte." });
      }
    } catch (e) {
      console.error(e);
      setCurrentReport({ error: "Error de conexión con el motor cognitivo." });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo_mindo.png" alt="Mindo Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-slate-800 tracking-tight">Mindo Parent</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full shadow-sm"
                />
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user.displayName}
                </span>
              </div >
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div >
          </div >
        </div >
      </nav >

      {/* Main Content */}
      < main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Perfiles de Niños</h1>
            <p className="text-sm text-slate-500 mt-1">Gestiona los perfiles y el tutor de Mindo para tus hijos (máximo 3)</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={handleOpenSettings}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-4 focus:ring-slate-100 cursor-pointer"
            >
              <Settings className="w-5 h-5" />
              Configuración Global
            </button>
            {profiles.length < 3 && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-4 focus:ring-indigo-100 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Añadir Perfil
              </button>
            )}
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-1 border-2 border-slate-200 rounded-3xl p-8 flex items-center justify-center bg-slate-100 min-h-[200px]">
              <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div
              onClick={handleOpenAdd}
              className="col-span-1 border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer group min-h-[250px]"
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Aún no hay perfiles</h3>
              <p className="text-sm text-slate-500 mt-2">Haz clic para crear el primer perfil y comenzar a aprender.</p>
            </div>
          ) : (
            profiles.map((p) => (
              <div key={p.profile_id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative transition-transform hover:-translate-y-1 hover:shadow-md">
                {/* Header card with theme color */}
                <div className="h-24 w-full relative flex items-end p-5" style={{ backgroundColor: p.ai_tutor.theme_color }}>
                  {/* Context menu toggle */}
                  <div className="absolute top-3 right-3 z-20">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === p.profile_id ? null : p.profile_id!)}
                      className="p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Menu Popover */}
                    {openMenuId === p.profile_id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            handleGenerateReport(p, 'weekly');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-indigo-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium border-b border-slate-50"
                        >
                          <FileText className="w-4 h-4 text-indigo-500" /> Generar Reporte
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(p.profile_id!)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-6 right-5 w-16 h-16 rounded-2xl bg-white shadow-md border-[3px] border-white flex items-center justify-center p-1">
                    <div
                      className="w-full h-full rounded-xl opacity-90"
                      style={{ backgroundColor: p.ai_tutor.theme_color }}
                    />
                  </div>
                  <h3 className="text-white text-xl font-bold drop-shadow-sm truncate pr-16">{p.child_name}</h3>
                </div>

                <div className="pt-8 px-5 pb-5 flex-1 flex flex-col">
                  <div className="text-sm text-slate-500 mb-4 grid grid-cols-2 gap-y-2">
                    <div>
                      <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Edad</span>
                      <span className="font-medium text-slate-800">{p.age} años</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Nivel Escolar</span>
                      <span className="font-medium text-slate-800 line-clamp-1">{p.school_level}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Tutor AI</span>
                      <span className="font-medium text-slate-800">
                        {p.ai_tutor.name}
                        <span className="text-slate-400 text-xs ml-2 font-normal">({p.ai_tutor.eye_variant === 'matrix_block' ? 'Bloques' : 'Círculos'})</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/tutor/${p.profile_id}`)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer group"
                    >
                      Launch Mindo
                      <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main >

      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProfile}
        editingProfile={editingProfile}
      />

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" /> Configuración Global
              </h2>
              <button onClick={() => setSettingsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Voz Oficial de Mindo</label>
              <p className="text-sm text-slate-500 mb-4">Selecciona la voz de lenguaje natural de Google Gemini Live que utilizarán todos los perfiles de los niños.</p>

              <select
                value={currentSettings.voiceName}
                onChange={(e) => setCurrentSettings({ ...currentSettings, voiceName: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Puck">Puck (Joven, enérgica y alegre)</option>
                <option value="Aoede">Aoede (Cálida y suave)</option>
                <option value="Charon">Charon (Profunda y grave)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveSettings(currentSettings)}
                className="px-5 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors shadow-sm cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Reporte de Progreso</h2>
                  <p className="text-sm text-slate-500">
                    {activeProfileForReport?.child_name} • Insight Engine (Gemini 3.1 Pro)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50 relative printable-content">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-slate-800">Analizando logs en BigQuery...</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Gemini 3.1 Pro está utilizando el modo de pensamiento profundo para extraer insights pedagógicos.
                  </p>
                </div>
              ) : currentReport && currentReport.error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-slate-600">{currentReport.error}</p>
                </div>
              ) : currentReport ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Executive Overview */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <path strokeDasharray={`${currentReport.engagement_score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3" className="animate-[stroke-dashoffset_1s_ease-out_forwards]" />
                      </svg>
                      <div className="text-center">
                        <span className="block text-3xl font-bold text-slate-800">{currentReport.engagement_score}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Score</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500" /> Tendencias Emocionales</h3>
                      <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                        {currentReport.emotional_trends}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-emerald-50/50 p-6 md:p-8 rounded-3xl border border-emerald-100 flex-1">
                      <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Fortalezas Notables
                      </h3>
                      <ul className="space-y-3">
                        {currentReport.strengths?.map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm md:text-base text-emerald-700 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-amber-50/50 p-6 md:p-8 rounded-3xl border border-amber-100 flex-1">
                      <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Áreas de Mejora
                      </h3>
                      <ul className="space-y-3">
                        {currentReport.weaknesses?.map((w: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm md:text-base text-amber-700 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Advice */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 md:p-8 rounded-3xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-indigo-500" /> Consejo para Padres
                    </h3>
                    <p className="text-indigo-900 leading-relaxed text-sm md:text-base italic">
                      "{currentReport.parent_advice}"
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                disabled={reportLoading}
                className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Imprimir
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-5 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div >
  );
}
