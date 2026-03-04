export interface AITutorTheme {
    name: string;
    language: 'english' | 'espanol_latino' | 'espanol_espana';
    eye_variant: 'matrix_block' | 'matrix_round';
    theme_color: string;
}

export interface PedagogicalState {
    current_subject: 'math' | 'science' | 'language' | 'reading';
    socratic_depth: 'adaptive';
    last_completed_task: string; // ISO timestamp
}

export interface ChildProfile {
    profile_id?: string;
    parent_uid: string;
    child_name: string;
    age: number; // 4-12
    school_level: string;
    ai_tutor: AITutorTheme;
    pedagogical_state: PedagogicalState;
    memories?: string[]; // Rag context facts
    createdAt?: string; // ISO timestamp
}

export interface ParentSettings {
    voiceName: 'Puck' | 'Aoede' | 'Charon';
}

export interface SessionLog {
    id?: string;
    child_id: string;
    duration_seconds: number;
    messages_exchanged: number;
    subject: string;
    alerts_triggered: number;
    timestamp: string; // ISO string
}
