import React, { useState, useEffect } from 'react';
import type { ChildProfile } from '../types';
import { X, Bot, Eraser } from 'lucide-react';
import { profileService } from '../services/profileService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileData: Omit<ChildProfile, 'profile_id' | 'parent_uid' | 'createdAt'>, profileId?: string) => Promise<void>;
    editingProfile: ChildProfile | null;
}

export default function ProfileModal({ isOpen, onClose, onSave, editingProfile }: ProfileModalProps) {
    const [name, setName] = useState('');
    const [age, setAge] = useState<number>(4);
    const [schoolLevel, setSchoolLevel] = useState('Preescolar');
    const [tutorName, setTutorName] = useState('Grid-Bot');
    const [themeColor, setThemeColor] = useState('#4f46e5');
    const [eyeVariant, setEyeVariant] = useState<'matrix_block' | 'matrix_round'>('matrix_block');
    const [language, setLanguage] = useState<'english' | 'espanol_latino' | 'espanol_espana'>('espanol_latino');
    const [loading, setLoading] = useState(false);
    const [isResettingMemory, setIsResettingMemory] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingProfile) {
            setName(editingProfile.child_name);
            setAge(editingProfile.age);
            setSchoolLevel(editingProfile.school_level);
            setTutorName(editingProfile.ai_tutor.name || 'Grid-Bot');
            setThemeColor(editingProfile.ai_tutor.theme_color || '#4f46e5');
            setEyeVariant(editingProfile.ai_tutor.eye_variant || 'matrix_block');
            setLanguage(editingProfile.ai_tutor.language || 'espanol_latino');
        } else {
            setName('');
            setAge(4);
            setSchoolLevel('Preescolar');
            setTutorName('Grid-Bot');
            setThemeColor('#4f46e5');
            setEyeVariant('matrix_block');
            setLanguage('espanol_latino');
        }
        setError('');
    }, [editingProfile, isOpen]);

    const handleResetMemory = async () => {
        if (!editingProfile?.profile_id) return;
        if (!window.confirm("¿Estás seguro de que deseas borrar todos los recuerdos de Mindo para este niño? Mindo olvidará todo lo que han hablado en sesiones anteriores.")) return;

        setIsResettingMemory(true);
        try {
            await profileService.clearMemories(editingProfile.profile_id);
            alert("Memoria borrada exitosamente. Mindo ha olvidado el contexto pasado.");
        } catch (err: unknown) {
            console.error(err);
            alert("Error al borrar la memoria.");
        } finally {
            setIsResettingMemory(false);
        }
    }

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSave({
                child_name: name,
                age,
                school_level: schoolLevel,
                ai_tutor: {
                    name: tutorName,
                    theme_color: themeColor,
                    eye_variant: eyeVariant,
                    language
                },
                pedagogical_state: editingProfile?.pedagogical_state || {
                    current_subject: 'reading',
                    socratic_depth: 'adaptive',
                    last_completed_task: new Date().toISOString()
                }
            }, editingProfile?.profile_id);
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error al guardar el perfil.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative my-8">
                <div className="absolute top-4 right-4">
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                            <Bot className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
                        </h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="border-b border-slate-100 pb-5 mb-5">
                            <h3 className="text-indigo-600 font-bold mb-4 uppercase text-xs tracking-wider">Datos del Niño</h3>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej. Leo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Edad (4-12)</label>
                                    <input
                                        type="number"
                                        required
                                        min={4}
                                        max={12}
                                        value={age}
                                        onChange={(e) => setAge(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel Escolar</label>
                                    <select
                                        value={schoolLevel}
                                        onChange={(e) => setSchoolLevel(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="Preescolar">Preescolar</option>
                                        <option value="Primaria Elemental">Prim. Elemental</option>
                                        <option value="Primaria Intermedia">Prim. Intermedia</option>
                                        <option value="Primaria Superior">Prim. Superior</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-purple-600 font-bold mb-4 uppercase text-xs tracking-wider">Personalización del Bot</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Bot</label>
                                <input
                                    type="text"
                                    required
                                    value={tutorName}
                                    onChange={(e) => setTutorName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ej. Grid-Bot"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Color Principal</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                                        <input
                                            type="color"
                                            required
                                            value={themeColor}
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            className="w-12 h-12 p-1 bg-transparent cursor-pointer border-r border-slate-200"
                                        />
                                        <input
                                            type="text"
                                            value={themeColor}
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            className="flex-1 px-3 py-3 bg-transparent outline-none text-slate-700 uppercase font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Forma de Ojos</label>
                                    <select
                                        value={eyeVariant}
                                        onChange={(e) => setEyeVariant(e.target.value as 'matrix_block' | 'matrix_round')}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="matrix_block">Bloques (Cuadrados)</option>
                                        <option value="matrix_round">Círculos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Idioma</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as 'english' | 'espanol_latino' | 'espanol_espana')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="espanol_latino">Español (Latino)</option>
                                    <option value="espanol_espana">Español (España)</option>
                                    <option value="english">English</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            {editingProfile && (
                                <button
                                    type="button"
                                    onClick={handleResetMemory}
                                    disabled={isResettingMemory}
                                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all tooltip-trigger relative group disabled:opacity-50"
                                    title="Borrar memoria a largo plazo (Amnesia)"
                                >
                                    <Eraser className="w-5 h-5" />
                                    {isResettingMemory && <span className="text-xs">Borrando...</span>}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Guardando...' : 'Guardar Perfil'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
