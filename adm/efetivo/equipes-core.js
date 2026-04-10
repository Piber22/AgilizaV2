// =============================================
//  EQUIPES-CORE.JS — Firebase · Config · State
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, onSnapshot,
    serverTimestamp, collection, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── FIREBASE ────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyCHelcLpwL0m6_YvXSGU2HVLU3dTQH7-is",
    authDomain:        "efetivo-9fc97.firebaseapp.com",
    projectId:         "efetivo-9fc97",
    storageBucket:     "efetivo-9fc97.firebasestorage.app",
    messagingSenderId: "893083830998",
    appId:             "1:893083830998:web:d6bf5f7913ff9590dd5777"
};

const firebaseApp = initializeApp(firebaseConfig);
const db          = getFirestore(firebaseApp);

export const STATE_DOC = doc(db, 'hsana', 'equipes_state');
export const LOG_COL   = collection(db, 'hsana_log');

let _isSavingLocally = false;
let _fbSaveTimer     = null;

export function saveStateToFirebase(stateData) {
    clearTimeout(_fbSaveTimer);
    _fbSaveTimer = setTimeout(async () => {
        try {
            _isSavingLocally = true;
            await setDoc(STATE_DOC, { state: stateData, updatedAt: serverTimestamp() });
        } catch (err) {
            console.warn('[Firebase] Erro ao salvar:', err);
            _isSavingLocally = false;
        }
    }, 800);
}

export async function logAction(action, details = {}) {
    try {
        await addDoc(LOG_COL, { action, ...details, ts: serverTimestamp() });
    } catch (err) {
        console.warn('[Firebase] Erro ao logar:', err);
    }
}

export async function loadStateFromFirebase() {
    try {
        const snap = await getDoc(STATE_DOC);
        if (snap.exists()) return snap.data().state;
    } catch (err) {
        console.warn('[Firebase] Erro ao carregar:', err);
    }
    return null;
}

export function subscribeToFirebase(onUpdate) {
    onSnapshot(STATE_DOC, (snap) => {
        if (_isSavingLocally) { _isSavingLocally = false; return; }
        if (!snap.exists()) return;
        const remoteState = snap.data().state;
        if (remoteState) onUpdate(remoteState);
    });
}

// ─── CONFIGURAÇÃO DAS EQUIPES ────────────────
export const TEAM_CONFIG = {
    graciela:      { name: 'Graciela',      capacity: 15, color: '#e0e0e0' },
    giovana:       { name: 'Giovana',        capacity: 15, color: '#e0e0e0' },
    jessica:       { name: 'Jéssica',       capacity: 7,  color: '#e0e0e0' },
    franciele:     { name: 'Franciele',      capacity: 7,  color: '#e0e0e0' },
    alisson:       { name: 'Alisson',        capacity: 4,  color: '#e0e0e0' },
    liderancas:    { name: 'Lideranças',     capacity: 5,  color: '#e0e0e0' },
    administrativo:{ name: 'Administrativo', capacity: 3,  color: '#e0e0e0' },
    afastados:     { name: 'Afastados',      capacity: 99, color: '#e0e0e0', noLimit: true },
};

// ─── DADOS INICIAIS ──────────────────────────
export function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeInitialData() {
    return {
        graciela: [
            { id: uid(), nome: 'KATIA',          tipo: 'colaborador' },
            { id: uid(), nome: 'CARMEM',          tipo: 'colaborador' },
            { id: uid(), nome: 'LEILA',           tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTINA',        tipo: 'colaborador' },
            { id: uid(), nome: 'RAFAEL',          tipo: 'colaborador' },
            { id: uid(), nome: 'CAROL',           tipo: 'colaborador' },
            { id: uid(), nome: 'ANDREA',          tipo: 'colaborador' },
            { id: uid(), nome: 'SILENE',          tipo: 'colaborador' },
            { id: uid(), nome: 'SUZANA',          tipo: 'colaborador' },
            { id: uid(), nome: 'PATRICIA',        tipo: 'colaborador' },
            { id: uid(), nome: 'DIEGO',           tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTIAN',        tipo: 'colaborador' },
            { id: uid(), nome: 'LUCIANO',         tipo: 'colaborador' },
        ],
        giovana: [
            { id: uid(), nome: 'PAULO ROBERTO',   tipo: 'colaborador' },
            { id: uid(), nome: 'LEANDRA',         tipo: 'colaborador' },
            { id: uid(), nome: 'CLAUDIA',         tipo: 'colaborador' },
            { id: uid(), nome: 'MAHANA',          tipo: 'colaborador' },
            { id: uid(), nome: 'MARTA',           tipo: 'colaborador' },
            { id: uid(), nome: 'EVERTON',         tipo: 'colaborador' },
            { id: uid(), nome: 'ROSANGELA',       tipo: 'colaborador' },
            { id: uid(), nome: 'ELCA',            tipo: 'colaborador' },
            { id: uid(), nome: 'PAULO RICARDO',   tipo: 'colaborador' },
            { id: uid(), nome: 'ANDREIA',         tipo: 'colaborador' },
            { id: uid(), nome: 'BEATRIZ',         tipo: 'colaborador' },
            { id: uid(), nome: 'MATEUS',          tipo: 'colaborador' },
            { id: uid(), nome: 'ROSELI',          tipo: 'colaborador' },
            { id: uid(), nome: 'EDUARDO',         tipo: 'colaborador' },
        ],
        jessica: [
            { id: uid(), nome: 'FERNANDO',        tipo: 'colaborador' },
            { id: uid(), nome: 'ANDERSON',        tipo: 'colaborador' },
            { id: uid(), nome: 'FRANCINA',        tipo: 'colaborador' },
            { id: uid(), nome: 'CRISTINA',        tipo: 'colaborador' },
            { id: uid(), nome: 'JESSICA',         tipo: 'colaborador' },
            { id: uid(), nome: 'DEBORA',          tipo: 'colaborador' },
            { id: uid(), nome: 'CESAR',           tipo: 'colaborador' },
        ],
        franciele: [
            { id: uid(), nome: 'IVAN',            tipo: 'colaborador' },
            { id: uid(), nome: 'LUIZ',            tipo: 'colaborador' },
            { id: uid(), nome: 'DJULIUS',         tipo: 'colaborador' },
            { id: uid(), nome: 'LUANA',           tipo: 'colaborador' },
            { id: uid(), nome: 'SIMONE',          tipo: 'colaborador' },
            { id: uid(), nome: 'VALERIA',         tipo: 'colaborador' },
        ],
        alisson: [
            { id: uid(), nome: 'MARISA',          tipo: 'colaborador' },
            { id: uid(), nome: 'ROSANGELA',       tipo: 'colaborador' },
        ],
        liderancas:     [],
        administrativo: [],
        afastados:      [],
    };
}

// ─── STATE GLOBAL ────────────────────────────
export let state = null;

export function setState(newState) {
    state = newState;
}

export function loadStateLocal() {
    try {
        const raw = localStorage.getItem('hsana_equipes_v3');
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
}

export function saveState() {
    localStorage.setItem('hsana_equipes_v3', JSON.stringify(state));
    saveStateToFirebase(state);
}

// ─── HELPERS ─────────────────────────────────
export function findColaborador(id) {
    for (const [teamKey, members] of Object.entries(state)) {
        const idx = members.findIndex(m => m.id === id);
        if (idx !== -1) return { teamKey, idx, member: members[idx] };
    }
    return null;
}

export function firstName(nome) {
    return nome.trim().split(' ')[0];
}

export function getHorarioLabel(member) {
    if (!member.horarioEntrada && !member.horarioSaida) return '';
    return `${member.horarioEntrada || '?'} - ${member.horarioSaida || '?'}`;
}