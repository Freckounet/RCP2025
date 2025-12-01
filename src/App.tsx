import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, 
  query, orderBy, deleteDoc, updateDoc, serverTimestamp, getDoc, where 
} from 'firebase/firestore';
import { 
  Calendar, MapPin, CheckCircle2, XCircle, AlertCircle, 
  Plus, Users, BarChart3, Shield, LogOut, ChevronRight, ChevronLeft, ChevronDown, Activity, User, Lock, Clock, Filter, HelpCircle, X, ClipboardList, GripVertical, Swords, Settings, Crown, CalendarDays, Save, Check, Edit3, Trash2, Share2, Copy, MousePointer2 
} from 'lucide-react';
import { deleteField } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAXJGC3z6hflWdN8-2F09Fee6XBNO0qrCw",  // Copie depuis ta capture
  authDomain: "rcp2025-57ddd.firebaseapp.com",
  projectId: "rcp2025-57ddd",
  storageBucket: "rcp2025-57ddd.firebasestorage.app",
  messagingSenderId: "88316267740",
  appId: "1:88316267740:web:ce68e8d22daaa95f73f819",
  measurementId: "G-KN0N51531G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'rcp-app-v1'; // On met un nom fixe, c'est plus simple

// --- UTILS ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

const getFullName = (p) => {
    if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name.toUpperCase()}`;
    return p.full_name || 'Utilisateur Inconnu';
};

const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'absent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'injured': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'no_response': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-zinc-500';
    }
};

const getStatusLabel = (status) => {
    switch(status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'injured': return 'Blessé';
      case 'no_response': return 'Non répondu';
      default: return '-';
    }
};

// Hash basique pour stocker un mot de passe sans le conserver en clair
const hashPassword = (pwd) => {
    if (!pwd) return '';
    if (typeof btoa === 'function') return btoa(pwd);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(pwd, 'utf-8').toString('base64');
    }
    return '';
};

// --- AUTH COMPONENT ---
const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const demoProfiles = [
    { label: 'Coach', email: 'coach@rcp.com', role: 'coach', fname: 'Coach', lname: 'Principal', position: 'Staff', category: 'staff' },
    { label: 'Joueur 1', email: 'joueur1@rcp.com', role: 'player', fname: 'Antoine', lname: 'Dupont', position: 'Demi de mêlée', category: '3/4' },
    { label: 'Joueur 2', email: 'joueur2@rcp.com', role: 'player', fname: 'Romain', lname: 'Ntamack', position: 'Demi d\'ouverture', category: '3/4' },
    { label: 'Joueur 3', email: 'joueur3@rcp.com', role: 'player', fname: 'Cyril', lname: 'Baille', position: 'Pilier', category: 'avant' },
  ];

  const handleStandardSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Merci de saisir email et mot de passe.');
      return;
    }
    if (isRegistering && password.length < 4) {
      setError('Mot de passe trop court (4 caractères min).');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    onLogin({
        email: normalizedEmail,
        role: 'player',
        first_name: firstName,
        last_name: lastName,
        position: 'Nouveau',
        category: 'avant', // Default
        isNew: isRegistering,
        isRegistering,
        password
    }).catch((err) => {
      setError(err.message || 'Impossible de se connecter.');
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.2),transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-red-900/50 transform rotate-3">
             <span className="text-4xl font-black text-black tracking-tighter">RCP</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Rugby Club Portois</h2>
          <p className="text-zinc-500 mt-2 font-medium">Application Officielle</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl">
           <div className="flex items-center gap-2 mb-4">
             <div className="h-1 w-1 rounded-full bg-red-500 animate-pulse"></div>
             <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Accès Démo Rapide</h3>
           </div>
           
              <div className="grid grid-cols-2 gap-3">
              {demoProfiles.map((p, i) => (
                <button 
                  key={i}
                  onClick={() => onLogin({ first_name: p.fname, last_name: p.lname, email: p.email.toLowerCase(), role: p.role, position: p.position, category: p.category, isRegistering: true, password: 'demo' }).catch((err) => setError(err.message || 'Impossible de se connecter.'))}
                  className={`p-3 rounded-xl border text-left transition-all group ${p.role === 'coach' ? 'bg-red-950/30 border-red-900/50 hover:bg-red-900/50 hover:border-red-600' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-500'}`}
                >
                   <div className="flex justify-between items-start mb-1">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${p.role === 'coach' ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{p.label}</div>
                      {p.role === 'coach' && <Shield size={12} className="text-red-500" />}
                   </div>
                   <div className="text-sm font-bold text-white truncate">{p.fname} {p.lname}</div>
                   <div className="text-[10px] text-zinc-500 truncate">{p.email}</div>
                </button>
              ))}
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
           <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-4">
              <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 text-sm font-bold pb-2 transition-colors ${!isRegistering ? 'text-white border-b-2 border-red-600' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Connexion
              </button>
              <button 
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 text-sm font-bold pb-2 transition-colors ${isRegistering ? 'text-white border-b-2 border-red-600' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Inscription
              </button>
           </div>
           
           <form onSubmit={handleStandardSubmit} className="space-y-4">
              {isRegistering && (
                <div className="animate-in slide-in-from-top-2 fade-in space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-1">
                        <User size={12} /> Prénom
                    </label>
                    <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                        placeholder="Ex: Antoine"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-1">
                        <User size={12} /> Nom
                    </label>
                    <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                        placeholder="Ex: Dupont"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-1">
                  <User size={12} /> Email
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all"
                  placeholder="exemple@rcp.com"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-1">
                  <Lock size={12} /> Mot de passe
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors mt-2">
                {isRegistering ? "Créer mon compte" : "Se connecter"}
              </button>

              {error && <p className="text-red-500 text-sm font-semibold text-center mt-2">{error}</p>}
           </form>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENTS ---

const Navbar = ({ user, profile, setView, currentView, onLogout }) => (
  <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-zinc-950/90 backdrop-blur-md border-t md:border-b md:border-t-0 border-zinc-800 z-50 px-4 py-3 md:py-4">
    <div className="max-w-4xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-black">R</div>
        <div className="hidden md:block">
          <div className="font-bold text-white leading-none">RCP</div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{profile?.role === 'coach' ? 'Espace Coach' : 'Espace Joueur'}</div>
        </div>
      </div>
      
      <div className="flex gap-2 md:gap-6 text-xs md:text-sm font-medium">
        {profile?.role === 'player' && (
           <button 
             onClick={() => setView('dashboard')} 
             className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             <Calendar size={20} />
             <span>Ma Semaine</span>
           </button>
        )}

        {profile?.role === 'coach' && (
          <>
            <button 
              onClick={() => setView('dashboard')} 
              className={`flex flex-col items-center gap-1 px-2 md:px-4 py-1 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Calendar size={20} />
              <span>Agenda</span>
            </button>
            <button 
              onClick={() => setView('validation')} 
              className={`flex flex-col items-center gap-1 px-2 md:px-4 py-1 rounded-lg transition-colors ${currentView === 'validation' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <ClipboardList size={20} />
              <span>Appel</span>
            </button>
            <button 
              onClick={() => setView('stats')} 
              className={`flex flex-col items-center gap-1 px-2 md:px-4 py-1 rounded-lg transition-colors ${currentView === 'stats' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <BarChart3 size={20} />
              <span>Stats</span>
            </button>
            <button 
              onClick={() => setView('squad')} 
              className={`flex flex-col items-center gap-1 px-2 md:px-4 py-1 rounded-lg transition-colors ${currentView === 'squad' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users size={20} />
              <span>Effectif</span>
            </button>
          </>
        )}

        <div className="h-8 w-px bg-zinc-800 mx-2 hidden md:block"></div>

        <button 
          onClick={() => setView('profile')} 
          className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${currentView === 'profile' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="relative">
            <User size={20} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <span>{profile?.first_name || 'Moi'}</span>
        </button>
      </div>
    </div>
  </nav>
);

// --- MODALS ---

const WeeklySummaryModal = ({ events, onClose }) => {
    const [summaryText, setSummaryText] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const textAreaRef = useRef(null);

    useEffect(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay() || 7; 
        startOfWeek.setDate(now.getDate() - day + 1); 
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); 

        const formatDateShort = (d) => {
            const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
            const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
            return `${day}/${month}`;
        };

        let text = `Programme de la semaine du ${formatDateShort(startOfWeek)} au ${formatDateShort(endOfWeek)}:\n\n`;

        if (events.length === 0) {
            text += "Aucun événement prévu pour le moment.\n";
        } else {
            const sorted = [...events].sort((a,b) => new Date(a.date) - new Date(b.date));
            sorted.forEach(e => {
                const d = new Date(e.date);
                const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' });
                const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                const dayNum = formatDateShort(d);

                text += `${capDay} ${dayNum}:\n`;

                if (e.type === 'match') {
                    text += `Match ${e.opponent ? 'contre ' + e.opponent : ''} ${e.location ? 'à ' + e.location : ''}.\nCoup d'envoi à ${e.time}.\n\n`;
                } else {
                    let endStr = "21h30";
                    if (e.time) {
                        const [h, m] = e.time.split(':').map(Number);
                        const endH = (h + 2) % 24;
                        const startFormatted = `${h}h${m.toString().padStart(2, '0')}`;
                        const endFormatted = `${endH}h${m.toString().padStart(2, '0')}`;
                        text += `Entraînement de ${startFormatted} à ${endFormatted} sur le terrain ${e.location}.\n\n`;
                    } else {
                        text += `Entraînement à ${e.time} sur le terrain ${e.location}.\n\n`;
                    }
                }
            });
        }

        text += "Merci de confirmer vos présences sur l'application\nLien vers l'application : https://rcp-2025-5u72.vercel.app\n\n";
        text += "LES COACHS.";
        setSummaryText(text);
    }, [events]);

    const handleCopy = () => {
        if (textAreaRef.current) {
            textAreaRef.current.select();
            document.execCommand('copy');
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
             <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Share2 className="text-red-500" /> Résumé de la semaine
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-xs text-zinc-500 mb-2">
                    Le texte ci-dessous est généré automatiquement. Vous pouvez le modifier avant de le copier.
                </p>

                <textarea 
                    ref={textAreaRef}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    className="w-full h-64 bg-black border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none resize-none font-mono leading-relaxed"
                />

                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={handleCopy}
                        className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all ${isCopied ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
                    >
                        {isCopied ? <><Check size={18} /> Copié !</> : <><Copy size={18} /> Copier le texte</>}
                    </button>
                </div>
             </div>
        </div>
    );
};

const CreateEvent = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    type: 'training',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: 'Stade Municipal',
    opponent: '' 
  });
  
  const [viewDate, setViewDate] = useState(new Date()); 
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewDate]);

  const handleDateClick = (day) => {
    if (!day) return;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setFormData({...formData, date: dateStr});
  };

  const changeMonth = (delta) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!formData.date) return;
    
    const fullDate = new Date(`${formData.date}T${formData.time}`);
    const title = formData.type === 'match' ? 'Match' : 'Entraînement';
    
    onCreate({ 
      ...formData, 
      title,
      date: fullDate.toISOString() 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-[95%] md:w-full max-w-lg rounded-3xl p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in flex flex-col md:flex-row gap-6 max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex-1 space-y-4">
           <h2 className="text-xl font-bold text-white">Nouvel Événement</h2>
           <div>
             <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-2">Type</label>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'training'})}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${formData.type === 'training' ? 'bg-zinc-800 border-red-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                  <Activity size={20} />
                  <span className="text-sm font-bold">Entraînement</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'match'})}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${formData.type === 'match' ? 'bg-zinc-800 border-red-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                  <Shield size={20} />
                  <span className="text-sm font-bold">Match</span>
                </button>
             </div>
           </div>
           
           {formData.type === 'match' && (
             <div className="animate-in slide-in-from-top-2 fade-in">
               <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 mb-1">
                 <Swords size={12} /> Adversaire
               </label>
               <input 
                  type="text" 
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-red-600 outline-none"
                  value={formData.opponent}
                  onChange={e => setFormData({...formData, opponent: e.target.value})}
                  placeholder="Ex: Stade Toulousain"
                />
             </div>
           )}

           <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Heure</label>
              <div className="relative w-full">
                <input 
                  type="time" 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-red-600 outline-none appearance-none"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
           </div>
           <div>
             <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Lieu</label>
             <input 
                type="text" 
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-red-600 outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
           </div>
        </div>
        <div className="flex-1 bg-black rounded-2xl p-4 border border-zinc-800">
           <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-zinc-500"><ChevronLeft size={20} /></button>
              <div className="font-bold text-white capitalize">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
              <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:text-white text-zinc-500"><ChevronRight size={20} /></button>
           </div>
           <div className="grid grid-cols-7 gap-1 mb-2">
             {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
               <div key={d} className="text-center text-[10px] text-zinc-600 font-bold uppercase">{d}</div>
             ))}
           </div>
           <div className="grid grid-cols-7 gap-1">
             {calendarDays.map((day, i) => {
                if (day === null) return <div key={i} className="aspect-square"></div>;
                const year = viewDate.getFullYear();
                const month = viewDate.getMonth() + 1;
                const dateStr = `${year}-${month < 10 ? '0'+month : month}-${day < 10 ? '0'+day : day}`;
                const isSelected = formData.date === dateStr;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all ${isSelected ? 'bg-red-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                  >
                    {day}
                  </button>
                );
             })}
           </div>
           <div className="mt-6 flex flex-col gap-2">
             <button onClick={handleSubmit} type="button" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200">
                Confirmer
             </button>
             <button onClick={onClose} type="button" className="w-full text-zinc-500 py-2 text-sm hover:text-white">
                Annuler
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const EventCard = ({ event, userEmail, attendances, onUpdateStatus, onDelete, isCoach }) => {
  const myAttendance = attendances.find(a => a.event_id === event.id && a.user_id === userEmail);
  const currentStatus = myAttendance?.status || null;
  const presentCount = attendances.filter(a => a.event_id === event.id && a.status === 'present').length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4 shadow-lg transition-all hover:border-zinc-700">
      <div className="p-5 border-b border-zinc-800/50 flex justify-between items-start relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${event.type === 'match' ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
              {event.type === 'match' ? 'Match' : 'Entraînement'}
            </span>
            {isCoach && (
              <button onClick={() => onDelete(event.id)} className="text-zinc-600 hover:text-red-500 p-1">
                <XCircle size={14} />
              </button>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-1 leading-tight">
             {event.type === 'match' && event.opponent ? `Match vs ${event.opponent}` : event.title}
          </h3>
          
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Calendar size={14} className="text-red-600" />
              <span className="text-zinc-300">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <MapPin size={14} className="text-red-600" />
              <span className="text-zinc-300">{event.location}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-3 text-center min-w-[70px]">
          <span className="block text-2xl font-bold text-white">{presentCount}</span>
          <span className="block text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Présents</span>
        </div>
      </div>

      {!isCoach ? (
        <div className="p-3 grid grid-cols-3 gap-2 bg-black/20">
            <button 
            onClick={() => onUpdateStatus(event.id, 'present')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${currentStatus === 'present' ? 'bg-green-600/20 border-green-600 text-green-500 shadow-[0_0_15px_rgba(22,163,74,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
            >
            <CheckCircle2 size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase">Présent</span>
            </button>

            <button 
            onClick={() => onUpdateStatus(event.id, 'absent')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${currentStatus === 'absent' ? 'bg-red-600/20 border-red-600 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
            >
            <XCircle size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase">Absent</span>
            </button>

            <button 
            onClick={() => onUpdateStatus(event.id, 'injured')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${currentStatus === 'injured' ? 'bg-orange-600/20 border-orange-600 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
            >
            <Activity size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase">Blessé</span>
            </button>
        </div>
      ) : (
          <div className="bg-black/20 p-3 text-center text-xs text-zinc-600 italic border-t border-zinc-800/50">
             Vue Coach - Gestion des présences dans l'onglet Appel
          </div>
      )}
    </div>
  );
};

// MODIFIED: SquadManagement to include First/Last name and Category
const SquadManagement = ({ allProfiles, seasons, onSaveSeason, onUpdatePlayer }) => {
    const [editingSeason, setEditingSeason] = useState(null);
    const [newSeason, setNewSeason] = useState({ name: '', start: '', end: '' });
    const [isAdding, setIsAdding] = useState(false);

    const handleCreate = () => {
        if (!newSeason.name || !newSeason.start || !newSeason.end) return;
        onSaveSeason(newSeason);
        setNewSeason({ name: '', start: '', end: '' });
        setIsAdding(false);
    };

    const handleUpdateSeason = (season) => {
        onSaveSeason(season);
        setEditingSeason(null);
    };

    return (
        <div className="pb-24 pt-4 px-4 max-w-4xl mx-auto animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <Users className="text-red-600" /> GESTION EFFECTIF
                </h2>
            </div>

            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Membres du Club ({allProfiles.length})</h3>
            <div className="space-y-3 mb-10">
                {allProfiles.map(profile => (
                    <div key={profile.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 group hover:border-zinc-700 transition-all">
                         <div className="flex flex-col md:flex-row md:items-center gap-4">
                             <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0 ${profile.role === 'coach' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                 {profile.first_name ? profile.first_name.charAt(0) : (profile.full_name?.charAt(0) || '?')}
                             </div>
                             
                             {/* UPDATE: Changed grid columns to accommodate arrival date */}
                             <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                 <div className="col-span-2 md:col-span-1">
                                    <label className="text-[9px] uppercase font-bold text-zinc-600 mb-1 block">Prénom</label>
                                    <input 
                                        value={profile.first_name || ''}
                                        onChange={(e) => onUpdatePlayer(profile.id, { first_name: e.target.value })}
                                        placeholder="Prénom"
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-600"
                                    />
                                 </div>
                                 <div className="col-span-2 md:col-span-1">
                                    <label className="text-[9px] uppercase font-bold text-zinc-600 mb-1 block">Nom</label>
                                    <input 
                                        value={profile.last_name || ''}
                                        onChange={(e) => onUpdatePlayer(profile.id, { last_name: e.target.value })}
                                        placeholder="Nom"
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-600"
                                    />
                                 </div>
                                 
                                 <div>
                                    <label className="text-[9px] uppercase font-bold text-zinc-600 mb-1 block">Groupe</label>
                                    <select 
                                        value={profile.category || 'avant'}
                                        onChange={(e) => onUpdatePlayer(profile.id, { category: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-600"
                                    >
                                        <option value="avant">Avants</option>
                                        <option value="3/4">3/4 (Arrières)</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                 </div>

                                 {/* ADDED: Arrival Date Input */}
                                 <div>
                                    <label className="text-[9px] uppercase font-bold text-zinc-600 mb-1 block">Arrivée</label>
                                    <input 
                                        type="date"
                                        value={profile.arrival_date || ''}
                                        onChange={(e) => onUpdatePlayer(profile.id, { arrival_date: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-600"
                                    />
                                 </div>

                                 <div>
                                    <label className="text-[9px] uppercase font-bold text-zinc-600 mb-1 block">Rôle App</label>
                                    <select 
                                        value={profile.role}
                                        onChange={(e) => onUpdatePlayer(profile.id, { role: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-600"
                                    >
                                        <option value="player">Joueur</option>
                                        <option value="coach">Coach</option>
                                    </select>
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays size={16} /> Gestion des Saisons
                 </h3>
                 <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-400 transition-colors"
                 >
                    <Plus size={14} /> Nouvelle Saison
                 </button>
            </div>

            <div className="space-y-4">
                {isAdding && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-in slide-in-from-top-2">
                         <h4 className="text-xs font-bold text-white mb-3">Créer une nouvelle saison</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                             <input 
                                placeholder="Nom (ex: 2026-2027)" 
                                value={newSeason.name}
                                onChange={e => setNewSeason({...newSeason, name: e.target.value})}
                                className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white focus:border-red-600 outline-none"
                             />
                             <input 
                                type="date"
                                value={newSeason.start}
                                onChange={e => setNewSeason({...newSeason, start: e.target.value})}
                                className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white focus:border-red-600 outline-none"
                             />
                             <input 
                                type="date"
                                value={newSeason.end}
                                onChange={e => setNewSeason({...newSeason, end: e.target.value})}
                                className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white focus:border-red-600 outline-none"
                             />
                         </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white">Annuler</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">Enregistrer</button>
                         </div>
                    </div>
                )}

                {seasons.sort((a,b) => new Date(b.start) - new Date(a.start)).map(season => (
                    <div key={season.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {editingSeason?.id === season.id ? (
                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                                 <input 
                                    value={editingSeason.name}
                                    onChange={e => setEditingSeason({...editingSeason, name: e.target.value})}
                                    className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white"
                                 />
                                 <input 
                                    type="date"
                                    value={editingSeason.start}
                                    onChange={e => setEditingSeason({...editingSeason, start: e.target.value})}
                                    className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white"
                                 />
                                 <input 
                                    type="date"
                                    value={editingSeason.end}
                                    onChange={e => setEditingSeason({...editingSeason, end: e.target.value})}
                                    className="bg-black border border-zinc-700 rounded-lg p-2 text-sm text-white"
                                 />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-white">{season.name}</div>
                                    <div className="text-xs text-zinc-500">
                                        Du {new Date(season.start).toLocaleDateString()} au {new Date(season.end).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                             {editingSeason?.id === season.id ? (
                                <>
                                    <button onClick={() => setEditingSeason(null)} className="p-2 text-zinc-500 hover:text-white"><X size={16} /></button>
                                    <button onClick={() => handleUpdateSeason(editingSeason)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check size={16} /></button>
                                </>
                             ) : (
                                <button onClick={() => setEditingSeason(season)} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 transition-colors">
                                    <Edit3 size={16} />
                                </button>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PresenceValidation = ({ events, attendances, allProfiles, onStatusChange }) => {
    const [selectedEventId, setSelectedEventId] = useState(events.length > 0 ? events[0].id : null);
    const [movingPlayerId, setMovingPlayerId] = useState(null); // NEW: State for mobile selection
    
    const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

    const columns = useMemo(() => {
        const cols = { present: [], absent: [], injured: [], no_response: [] };
        if (!selectedEventId) return cols;

        allProfiles.filter(p => p.role === 'player').forEach(player => {
            const att = attendances.find(a => a.event_id === selectedEventId && a.user_id === player.id);
            const status = att ? att.status : 'no_response';
            if (cols[status]) cols[status].push(player);
            else cols['no_response'].push(player);
        });
        return cols;
    }, [selectedEventId, attendances, allProfiles]);

    const handleDragStart = (e, playerId) => { 
        if (movingPlayerId) setMovingPlayerId(null); // Clear click selection if dragging starts
        e.dataTransfer.setData("playerId", playerId); 
        e.dataTransfer.effectAllowed = "move"; 
    };
    
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const playerId = e.dataTransfer.getData("playerId");
        if (playerId && selectedEventId) onStatusChange(playerId, selectedEventId, newStatus);
    };

    // NEW: Click handlers for mobile/accessible interaction
    const handlePlayerClick = (playerId) => {
        setMovingPlayerId(prev => prev === playerId ? null : playerId);
    };

    const handleColumnClick = (status) => {
        if (movingPlayerId && selectedEventId) {
            onStatusChange(movingPlayerId, selectedEventId, status);
            setMovingPlayerId(null);
        }
    };

    const Column = ({ status, title, colorClass, items }) => (
        <div 
            className={`flex-1 min-w-[250px] bg-zinc-900/50 border rounded-xl flex flex-col h-[600px] transition-all duration-200 ${
                movingPlayerId ? 'cursor-pointer border-dashed border-2 hover:bg-zinc-800' : 'border-zinc-800/50'
            } ${
                movingPlayerId ? (status === 'present' ? 'border-green-500/50' : status === 'absent' ? 'border-red-500/50' : status === 'injured' ? 'border-orange-500/50' : 'border-zinc-500/50') : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            onClick={() => handleColumnClick(status)} // Allow clicking column to drop
        >
            <div className={`p-4 border-b border-zinc-800/50 flex justify-between items-center ${colorClass}`}>
                <h3 className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    {title}
                    {movingPlayerId && <div className="text-[10px] animate-pulse bg-white/20 px-2 rounded-full text-white">Déplacer ici</div>}
                </h3>
                <span className="bg-black/40 px-2 py-0.5 rounded text-xs font-bold">{items.length}</span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-2">
                {items.map(player => (
                    <div 
                        key={player.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, player.id)}
                        onClick={(e) => { e.stopPropagation(); handlePlayerClick(player.id); }}
                        className={`bg-zinc-900 border p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group select-none ${
                            movingPlayerId === player.id 
                                ? 'border-red-500 ring-2 ring-red-500/50 scale-[1.02] z-10 bg-zinc-800' 
                                : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {movingPlayerId === player.id ? (
                                <MousePointer2 size={16} className="text-red-500 animate-bounce" />
                            ) : (
                                <GripVertical size={16} className="text-zinc-600" />
                            )}
                            <div>
                                <div className="font-bold text-white text-sm">{getFullName(player)}</div>
                                <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                                    <span className="font-black text-zinc-400">{player.category === 'avant' ? 'AVANT' : player.category === '3/4' ? '3/4' : ''}</span>
                                    {player.position && <span>• {player.position}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="pb-24 pt-4 px-4 h-full animate-in fade-in">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                        <ClipboardList className="text-red-600" /> APPEL
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1 md:hidden">
                        <span className="text-red-500 font-bold">Astuce Mobile :</span> Touchez un joueur pour le sélectionner, puis touchez une colonne pour le déplacer.
                    </p>
                </div>
                
                <div className="relative w-full md:w-auto min-w-[300px]">
                    <select 
                        value={selectedEventId || ''}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-white p-3 pr-10 rounded-xl focus:border-red-600 outline-none font-bold text-sm"
                    >
                        {sortedEvents.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {new Date(ev.date).toLocaleDateString('fr-FR')} - {ev.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                <Column status="present" title="Présents" colorClass="text-green-500 bg-green-500/5" items={columns.present} />
                <Column status="absent" title="Absents" colorClass="text-red-500 bg-red-500/5" items={columns.absent} />
                <Column status="injured" title="Blessés" colorClass="text-orange-500 bg-orange-500/5" items={columns.injured} />
                <Column status="no_response" title="Sans Réponse" colorClass="text-zinc-500 bg-zinc-500/5" items={columns.no_response} />
            </div>
        </div>
    );
};

const PlayerDetailModal = ({ player, events, attendances, onClose }) => {
  if (!player) return null;

  const history = events.map(event => {
    const att = attendances.find(a => a.user_id === player.id && a.event_id === event.id);
    return {
      event,
      status: att ? att.status : 'no_response'
    };
  }).reverse();

  const present = history.filter(h => h.status === 'present').length;
  const absent = history.filter(h => h.status === 'absent').length;
  const injured = history.filter(h => h.status === 'injured').length;
  const noResponse = history.filter(h => h.status === 'no_response').length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-zinc-950 p-6 border-b border-zinc-800 flex justify-between items-start">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-red-900/40">
                {player.first_name ? player.first_name.charAt(0) : player.full_name?.charAt(0)}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-white leading-none">{getFullName(player)}</h2>
                <div className="text-zinc-500 font-medium mt-1 uppercase tracking-wider text-xs flex items-center gap-2">
                    {player.category === 'avant' ? <span className="text-red-500 font-bold">AVANT</span> : player.category === '3/4' ? <span className="text-blue-500 font-bold">3/4</span> : null}
                    <span>• {player.position}</span>
                </div>
                {player.arrival_date && (
                    <div className="text-green-600 text-[10px] mt-1 font-bold">Arrivé le {formatDate(player.arrival_date)}</div>
                )}
             </div>
          </div>
          <button onClick={onClose} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                 <div className="text-2xl font-black text-green-500">{present}</div>
                 <div className="text-[10px] font-bold text-green-700 uppercase">Présents</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                 <div className="text-2xl font-black text-red-500">{absent}</div>
                 <div className="text-[10px] font-bold text-red-700 uppercase">Absents</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-center">
                 <div className="text-2xl font-black text-orange-500">{injured}</div>
                 <div className="text-[10px] font-bold text-orange-700 uppercase">Blessés</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-xl text-center">
                 <div className="text-2xl font-black text-zinc-400">{noResponse}</div>
                 <div className="text-[10px] font-bold text-zinc-500 uppercase">Sans Rép.</div>
              </div>
           </div>
           <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Clock size={16} /> Historique ({history.length})
           </h3>
           <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.event.type === 'match' ? 'bg-red-900/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                         {item.event.type === 'match' ? <Shield size={16} /> : <Activity size={16} />}
                      </div>
                      <div>
                         <div className="font-bold text-sm text-white">
                             {item.event.type === 'match' && item.event.opponent ? `Match vs ${item.event.opponent}` : item.event.title}
                         </div>
                         <div className="text-xs text-zinc-500">{formatDate(item.event.date)}</div>
                      </div>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const CoachDashboard = ({ events, attendances, allProfiles, seasons }) => {
  const [filterType, setFilterType] = useState('all'); 
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
         const now = new Date();
         const current = seasons.find(s => new Date(s.start) <= now && new Date(s.end) >= now);
         if (current) setSelectedSeasonId(current.id);
         else {
             const sorted = [...seasons].sort((a,b) => new Date(b.start) - new Date(a.start));
             if(sorted.length > 0) setSelectedSeasonId(sorted[0].id);
         }
    }
  }, [seasons, selectedSeasonId]);

  const activeSeason = seasons.find(s => s.id === selectedSeasonId);

  const seasonEvents = useMemo(() => {
    if (!activeSeason) return [];
    const start = new Date(activeSeason.start);
    const end = new Date(activeSeason.end);
    end.setHours(23, 59, 59, 999);
    return events.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });
  }, [events, activeSeason]);

  const validEvents = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; 
    startOfWeek.setDate(now.getDate() - day + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    return seasonEvents.filter(e => new Date(e.date) <= endOfWeek);
  }, [seasonEvents]);

  const stats = useMemo(() => {
    const trainingEvents = validEvents.filter(e => e.type === 'training');
    const matchEvents = validEvents.filter(e => e.type === 'match');
    
    const players = allProfiles.filter(p => p.role === 'player');
    
    const calculateGlobalRate = (subsetEvents) => {
        if (subsetEvents.length === 0) return 0;
        let totalRate = 0;
        let validPlayerCount = 0;

        players.forEach(player => {
             const playerArrival = player.arrival_date ? new Date(player.arrival_date) : new Date('2000-01-01');
             const playerEvents = subsetEvents.filter(e => new Date(e.date) >= playerArrival);

             if (playerEvents.length === 0) return; 

             const subsetIds = new Set(playerEvents.map(e => e.id));
             const playerAtts = attendances.filter(a => subsetIds.has(a.event_id) && a.user_id === player.id);
             
             const present = playerAtts.filter(a => a.status === 'present').length;
             const injured = playerAtts.filter(a => a.status === 'injured').length;
             
             const effectiveTotal = playerEvents.length - injured;
             
             if (effectiveTotal > 0) {
                 totalRate += (present / effectiveTotal);
                 validPlayerCount++;
             } else if (injured === playerEvents.length) {
                 totalRate += 1;
                 validPlayerCount++;
             }
        });
        
        return validPlayerCount > 0 ? Math.round((totalRate / validPlayerCount) * 100) : 0;
    };

    return {
        training: calculateGlobalRate(trainingEvents),
        match: calculateGlobalRate(matchEvents),
        trainingCount: trainingEvents.length,
        matchCount: matchEvents.length
    };
  }, [validEvents, attendances, allProfiles]);

  const playerStats = useMemo(() => {
    let filteredEvents = validEvents;
    if (filterType === 'training') filteredEvents = validEvents.filter(e => e.type === 'training');
    if (filterType === 'match') filteredEvents = validEvents.filter(e => e.type === 'match');

    return allProfiles
      .filter(p => p.role === 'player')
      .map(player => {
        const playerArrival = player.arrival_date ? new Date(player.arrival_date) : new Date('2000-01-01');
        const playerSpecificEvents = filteredEvents.filter(e => new Date(e.date) >= playerArrival);

        const eventIds = new Set(playerSpecificEvents.map(e => e.id));
        const playerAttendance = attendances.filter(a => a.user_id === player.id && eventIds.has(a.event_id));
        
        const present = playerAttendance.filter(a => a.status === 'present').length;
        const injured = playerAttendance.filter(a => a.status === 'injured').length;
        const absent = playerAttendance.filter(a => a.status === 'absent').length;
        const noResponse = playerSpecificEvents.length - (present + injured + absent);
        
        const effectiveTotal = playerSpecificEvents.length - injured;
        const rate = effectiveTotal > 0 
            ? Math.round((present / effectiveTotal) * 100) 
            : (playerSpecificEvents.length > 0 && injured === playerSpecificEvents.length ? 100 : 0);
        
        return { 
            ...player, 
            present, injured, absent, noResponse, rate, 
            total: playerSpecificEvents.length, 
            effectiveTotal,
            filteredHistoryEvents: playerSpecificEvents 
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [allProfiles, attendances, validEvents, filterType]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
         <h2 className="text-2xl font-black text-white italic">TABLEAU DE BORD</h2>
         
         {seasons.length > 0 ? (
             <div className="relative w-full md:w-auto min-w-[200px]">
                 <select 
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-white p-2 pl-3 pr-10 rounded-xl focus:border-red-600 outline-none text-sm font-bold shadow-sm"
                 >
                    {seasons.sort((a,b) => new Date(b.start) - new Date(a.start)).map(s => (
                        <option key={s.id} value={s.id}>Saison {s.name}</option>
                    ))}
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronDown size={14} />
                </div>
             </div>
         ) : (
            <div className="text-xs text-red-500 font-bold bg-red-950/20 px-3 py-1 rounded-full border border-red-900/50">
                Configurez une saison dans l'onglet Effectif
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <Activity size={16} />
                <span className="uppercase tracking-widest text-[10px] font-bold">Entraînements</span>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">{stats.training}%</div>
            <div className="text-zinc-500 text-xs mt-1 font-medium bg-black/30 inline-block px-2 py-1 rounded">{stats.trainingCount} sessions</div>
          </div>
          <Activity size={80} className="absolute -right-4 -bottom-4 text-zinc-800 opacity-50 rotate-12" />
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-red-900/20">
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 text-red-200">
                <Shield size={16} />
                <span className="uppercase tracking-widest text-[10px] font-bold">Matchs</span>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">{stats.match}%</div>
            <div className="text-red-200 text-xs mt-1 font-medium bg-red-950/30 inline-block px-2 py-1 rounded">{stats.matchCount} matchs joués</div>
          </div>
           <Shield size={80} className="absolute -right-4 -bottom-4 text-red-950 opacity-40 rotate-12" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Classement</h3>
        <div className="bg-zinc-900 p-1 rounded-lg flex text-xs font-bold">
           <button 
             onClick={() => setFilterType('all')}
             className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'all' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             Tout
           </button>
           <button 
             onClick={() => setFilterType('training')}
             className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'training' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             Entraînements
           </button>
           <button 
             onClick={() => setFilterType('match')}
             className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'match' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             Matchs
           </button>
        </div>
      </div>

      <div className="grid gap-3">
        {playerStats.map((player, idx) => (
          <button 
             key={player.id} 
             onClick={() => setSelectedPlayer(player)}
             className="w-full bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl flex items-center justify-between hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${idx < 3 ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white'}`}>
                {idx + 1}
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-red-500 transition-colors">{getFullName(player)}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2">
                    {player.category === 'avant' ? <span className="text-red-500">AVANT</span> : player.category === '3/4' ? <span className="text-blue-500">3/4</span> : null}
                    {player.position && <span>• {player.position}</span>}
                    {player.arrival_date && <span className="text-zinc-600 font-normal normal-case">• Arrivé {new Date(player.arrival_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: player.total > 0 ? `${(player.present / player.total) * 100}%` : '0%' }}></div>
                  <div className="h-full bg-orange-500" style={{ width: player.total > 0 ? `${(player.injured / player.total) * 100}%` : '0%' }}></div>
                  <div className="h-full bg-red-500" style={{ width: player.total > 0 ? `${(player.absent / player.total) * 100}%` : '0%' }}></div>
               </div>

               <div className="text-right">
                 <div className={`font-black text-lg ${player.rate > 75 ? 'text-green-500' : player.rate > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                   {player.rate}%
                 </div>
                 <div className="text-[9px] text-zinc-600 uppercase font-bold text-right flex items-center justify-end gap-1">
                   {player.noResponse > 0 && <span className="text-zinc-500 flex items-center gap-0.5"><HelpCircle size={8} /> {player.noResponse}</span>}
                   <span>{player.present}/{player.effectiveTotal}</span>
                 </div>
               </div>
               <ChevronRight size={16} className="text-zinc-700 group-hover:text-white" />
            </div>
          </button>
        ))}
        {playerStats.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            Aucun joueur actif ou événements dans cette saison.
          </div>
        )}
      </div>

      <PlayerDetailModal 
        player={selectedPlayer} 
        events={selectedPlayer?.filteredHistoryEvents || []} 
        attendances={attendances} 
        onClose={() => setSelectedPlayer(null)} 
      />
    </div>
  );
};

// MODIFIED: ProfileEditor with split inputs and Category selector
const ProfileEditor = ({ profile, onSave, onLogout }) => {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [pos, setPos] = useState(profile?.position || '');
  const [category, setCategory] = useState(profile?.category || 'avant');

  // Handle migration if only full_name exists
  useEffect(() => {
     if (!firstName && !lastName && profile?.full_name) {
         const parts = profile.full_name.split(' ');
         if (parts.length > 0) {
             setFirstName(parts[0]);
             setLastName(parts.slice(1).join(' '));
         }
     }
  }, [profile]);
  
  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center mb-6">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl font-bold text-black mx-auto mb-4 shadow-xl shadow-red-900/30">
            {firstName.charAt(0) || 'U'}
        </div>
        <h2 className="text-2xl font-black text-white">{firstName} {lastName}</h2>
        <div className="inline-block mt-2 px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
           {profile?.role === 'coach' ? 'Staff Technique' : 'Effectif Seniors'}
           <span>•</span>
           <span className={category === 'avant' ? 'text-red-500' : 'text-blue-500'}>{category === 'avant' ? 'AVANT' : '3/4'}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          {profile?.role === 'coach' ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Prénom</label>
                  <input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-red-600 outline-none"
                  />
              </div>
              <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Nom</label>
                  <input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-red-600 outline-none"
                  />
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl border border-zinc-800 bg-black/40 text-left">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Identité</div>
              <div className="text-white font-semibold">{firstName} {lastName}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Contactez un coach si une correction est nécessaire.</div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Groupe</label>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setCategory('avant')}
                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${category === 'avant' ? 'bg-red-600 border-red-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                    AVANTS
                </button>
                <button 
                    onClick={() => setCategory('3/4')}
                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${category === '3/4' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                    3/4 (ARRIÈRES)
                </button>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Poste Précis (Optionnel)</label>
            <input 
              value={pos} 
              onChange={e => setPos(e.target.value)}
              placeholder="Ex: Ailier, Pilier..."
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-red-600 outline-none"
            />
          </div>
          
          <button 
            onClick={() => {
              const payload = profile?.role === 'coach' 
                ? { first_name: firstName, last_name: lastName, position: pos, category }
                : { position: pos, category };
              onSave(payload);
            }}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 mt-6"
          >
            Enregistrer
          </button>
        </div>
        
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-500 py-4 font-bold text-sm bg-red-950/10 rounded-xl hover:bg-red-950/30 border border-transparent hover:border-red-900 transition-all">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // NEW: State for summary modal
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showFutureEvents, setShowFutureEvents] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main');
        const unsubP = onSnapshot(profileRef, (docSnap) => {
           if (docSnap.exists()) {
             setProfile({ id: currentUser.uid, ...docSnap.data() });
             setIsLoading(false);
           } else {
             setProfile(null);
             setIsLoading(false);
           }
        });
        return () => unsubP();
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    if (view === 'dashboard' && profile.role === 'coach' && events.length === 0) {}

    const eventsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'events'), orderBy('date', 'asc'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const attQuery = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    const unsubAtt = onSnapshot(attQuery, (snapshot) => {
      setAttendances(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const publicProfilesQuery = collection(db, 'artifacts', appId, 'public', 'data', 'user_summaries');
    const unsubAllProfiles = onSnapshot(publicProfilesQuery, (snapshot) => {
        setAllProfiles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const seasonsRef = collection(db, 'artifacts', appId, 'public', 'data', 'seasons');
    const unsubSeasons = onSnapshot(seasonsRef, (snapshot) => {
        setSeasons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubEvents();
      unsubAtt();
      unsubAllProfiles();
      unsubSeasons();
    };
  }, [user, profile]);

  const handleLogin = async (userData) => {
      if (!user) return;
      setIsLoading(true);
      try {
        const providedEmail = (userData.email || '').trim();
        const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const emailProfileRef = doc(db, 'artifacts', appId, 'users_by_email', providedEmail);
        const publicSummaryRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_summaries', providedEmail);

        const [snapEmailProfile, snapUserProfile, snapPublic] = await Promise.all([
          getDoc(emailProfileRef),
          getDoc(userProfileRef),
          getDoc(publicSummaryRef)
        ]);
        const existingEmailProfile = snapEmailProfile.exists() ? snapEmailProfile.data() : null;
        const existingUserProfile = snapUserProfile.exists() ? snapUserProfile.data() : null;
        const existingPublic = snapPublic?.exists() ? snapPublic.data() : null;

        if (userData.isRegistering) {
          // Nouveau compte : on repart de zéro avec les valeurs saisies
          const newProfileData = {
            email: providedEmail,
            role: userData.role,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            position: userData.position || '',
            category: userData.category || 'avant',
            created_at: serverTimestamp(),
            arrival_date: new Date().toISOString().split('T')[0],
            password_hash: hashPassword(userData.password || '')
          };

          await Promise.all([
            setDoc(userProfileRef, newProfileData), // pas de merge pour éliminer d’anciennes données
            setDoc(emailProfileRef, newProfileData), // doc stable par email pour la connexion
            setDoc(publicSummaryRef, { ...newProfileData, id: providedEmail, password_hash: deleteField() }) // pas de mot de passe dans le résumé public
          ]);
          setView(newProfileData.role === 'coach' ? 'stats' : 'dashboard');
          return;
        }

        // Connexion : un profil doit déjà exister
        if (!existingEmailProfile && !existingPublic && !existingUserProfile) {
          throw new Error('Profil introuvable. Vérifie tes identifiants ou passe en inscription.');
        }

        // Vérifier le mot de passe
        const profileData = existingEmailProfile || existingUserProfile || {};
        if (!profileData.password_hash) {
          throw new Error('Mot de passe non défini. Repasse par "Inscription" avec cet email pour le définir.');
        }
        const providedHash = hashPassword(userData.password || '');
        if (providedHash !== profileData.password_hash) {
          throw new Error('Identifiants invalides.');
        }

        // Mise à jour minimale pour garder les infos existantes, sans résidus ni diffusion du hash
        const { password_hash, email_normalized, ...cleanBase } = { ...existingPublic, ...existingUserProfile, ...existingEmailProfile, password_hash: profileData.password_hash };
        const mergedFirstName = cleanBase.first_name || profileData.first_name || '';
        const mergedLastName = cleanBase.last_name || profileData.last_name || '';
        const newProfileData = {
            ...cleanBase,
            email: providedEmail || cleanBase.email || '',
            first_name: mergedFirstName,
            last_name: mergedLastName,
            full_name: (mergedFirstName || mergedLastName) ? `${mergedFirstName} ${mergedLastName}`.trim() : (cleanBase.full_name || ''),
            password_hash: profileData.password_hash
        };

        await Promise.all([
          setDoc(userProfileRef, newProfileData, { merge: true }),
          setDoc(emailProfileRef, newProfileData, { merge: true }),
          setDoc(publicSummaryRef, { ...newProfileData, id: providedEmail, password_hash: deleteField() }, { merge: true })
        ]);
        
        setView(newProfileData.role === 'coach' ? 'stats' : 'dashboard');
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
  };

  const handleLogout = async () => {
      if (user) {
          setProfile(null);
      }
  };

  const handleUpdateStatus = async (eventId, status) => {
    if (!user || !profile?.email) return;
    const userKey = profile.email;
    const existing = attendances.find(a => a.event_id === eventId && a.user_id === userKey);
    const attCollection = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    if (existing) {
      if (existing.status === status) return; 
      await updateDoc(doc(attCollection, existing.id), { status, updated_at: serverTimestamp() });
    } else {
      await addDoc(attCollection, { user_id: userKey, event_id: eventId, status, created_at: serverTimestamp() });
    }
  };

  const handleCoachUpdateStatus = async (targetUserId, eventId, status) => {
    const existing = attendances.find(a => a.event_id === eventId && a.user_id === targetUserId);
    const attCollection = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    
    if (status === 'no_response') {
        if (existing) {
            await deleteDoc(doc(attCollection, existing.id));
        }
        return;
    }

    if (existing) {
      if (existing.status === status) return; 
      await updateDoc(doc(attCollection, existing.id), { status, updated_at: serverTimestamp() });
    } else {
      await addDoc(attCollection, { user_id: targetUserId, event_id: eventId, status, created_at: serverTimestamp() });
    }
  };

  const handleCreateEvent = async (eventData) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), {
      ...eventData, created_by: profile.email, created_at: serverTimestamp()
    });
  };

  const handleDeleteEvent = async (eventId) => {
     if(confirm('Supprimer cet événement ?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId));
     }
  };

  const handleUpdateProfile = async (newData) => {
    // Construct full_name for backward compat
    const full_name = newData.first_name || newData.last_name ? `${newData.first_name || ''} ${newData.last_name || ''}`.trim() : undefined;
    const dataToSave = full_name ? { ...newData, full_name } : { ...newData };

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), dataToSave, { merge: true });
    if (profile.email) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_summaries', profile.email), dataToSave, { merge: true });
    }
    setView('dashboard');
  };

  const handleAdminUpdatePlayer = async (targetId, updates) => {
      // If updating names, also update full_name backup
      let enrichedUpdates = { ...updates };
      if (updates.first_name || updates.last_name) {
           // We'd need current data to reconstruct perfectly, but this simple merge might be risky for partial updates.
           // However, for this UI, we usually have both.
      }

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_summaries', targetId), enrichedUpdates);
      if (targetId === profile.email) {
           await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), enrichedUpdates);
      }
  };

  const handleSaveSeason = async (seasonData) => {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'seasons');
      if (seasonData.id) {
          await updateDoc(doc(collectionRef, seasonData.id), seasonData);
      } else {
          await addDoc(collectionRef, { ...seasonData, created_at: serverTimestamp() });
      }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-red-600 animate-pulse font-bold tracking-widest">CHARGEMENT...</div>;

  if (!profile) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  const categorizedEvents = (() => {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7; 
      startOfWeek.setDate(now.getDate() - day + 1);
      startOfWeek.setHours(0,0,0,0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);

      const currentWeek = [];
      const past = [];
      const future = [];

      events.forEach(e => {
          const d = new Date(e.date);
          if (d >= startOfWeek && d <= endOfWeek) {
              currentWeek.push(e);
          } else if (d < startOfWeek) {
              past.push(e);
          } else {
              future.push(e);
          }
      });

      past.sort((a,b) => new Date(b.date) - new Date(a.date));

      return { currentWeek, past, future };
  })();

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-red-900 selection:text-white pb-20 md:pb-0">
      <Navbar user={user} profile={profile} setView={setView} currentView={view} onLogout={handleLogout} />
      <main className="pt-4 md:pt-20">
        {view === 'dashboard' && (
          <div className="px-4 max-w-4xl mx-auto animate-in fade-in">
            {/* ... Dashboard content remains same ... */}
            <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-black italic flex items-center gap-2">
                 {profile.role === 'coach' ? 'AGENDA DU CLUB' : 'MA SEMAINE'}
               </h1>
               {profile.role === 'coach' && (
                 <div className="flex gap-2">
                    <button 
                       onClick={() => setIsSummaryModalOpen(true)}
                       className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-3 rounded-full transition-all hover:scale-105"
                       title="Générer le résumé de la semaine"
                    >
                       <Share2 size={24} />
                    </button>
                    <button 
                       onClick={() => setIsCreateModalOpen(true)}
                       className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg shadow-red-900/40 transition-transform hover:scale-105"
                    >
                       <Plus size={24} />
                    </button>
                 </div>
               )}
            </div>
            
            {profile.role === 'coach' && categorizedEvents.past.length > 0 && (
                <div className="mb-6">
                    <button 
                        onClick={() => setShowPastEvents(!showPastEvents)}
                        className="w-full flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Événements Passés ({categorizedEvents.past.length})
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${showPastEvents ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showPastEvents && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                            {categorizedEvents.past.map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    userEmail={profile.email} 
                                    attendances={attendances}
                                    onUpdateStatus={handleUpdateStatus}
                                    onDelete={handleDeleteEvent}
                                    isCoach={profile.role === 'coach'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></div>
                Cette Semaine
            </h3>
            
            {categorizedEvents.currentWeek.length === 0 ? (
               <div className="text-center py-12 mb-6 border border-zinc-900 bg-zinc-900/20 rounded-2xl">
                  <div className="bg-zinc-900/50 inline-block p-4 rounded-full mb-3">
                     <Calendar size={32} className="text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-medium text-sm">Rien de prévu cette semaine.</p>
                  {profile.role === 'coach' && <p className="text-red-500 text-xs mt-1 cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>Ajouter un événement</p>}
               </div>
            ) : (
               <div className="space-y-4 mb-6">
                  {categorizedEvents.currentWeek.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      userEmail={profile.email} 
                      attendances={attendances}
                      onUpdateStatus={handleUpdateStatus}
                      onDelete={handleDeleteEvent}
                      isCoach={profile.role === 'coach'}
                    />
                  ))}
               </div>
            )}

            {profile.role === 'coach' && categorizedEvents.future.length > 0 && (
                <div className="mb-20">
                    <button 
                        onClick={() => setShowFutureEvents(!showFutureEvents)}
                        className="w-full flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> À Venir ({categorizedEvents.future.length})
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${showFutureEvents ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showFutureEvents && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                            {categorizedEvents.future.map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    userEmail={profile.email} 
                                    attendances={attendances}
                                    onUpdateStatus={handleUpdateStatus}
                                    onDelete={handleDeleteEvent}
                                    isCoach={profile.role === 'coach'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>
        )}
        {view === 'stats' && profile.role === 'coach' && (
           <CoachDashboard events={events} attendances={attendances} allProfiles={allProfiles} seasons={seasons} />
        )}
        {view === 'validation' && profile.role === 'coach' && (
           <PresenceValidation 
                events={events} 
                attendances={attendances} 
                allProfiles={allProfiles} 
                onStatusChange={handleCoachUpdateStatus} 
           />
        )}
        {view === 'squad' && profile.role === 'coach' && (
            <SquadManagement 
                allProfiles={allProfiles} 
                seasons={seasons} 
                onSaveSeason={handleSaveSeason} 
                onUpdatePlayer={handleAdminUpdatePlayer} 
            />
        )}
        {view === 'profile' && (
           <ProfileEditor profile={profile} onSave={handleUpdateProfile} onLogout={handleLogout} />
        )}
      </main>
      
      {/* Modals */}
      {isCreateModalOpen && (
        <CreateEvent onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateEvent} />
      )}
      {isSummaryModalOpen && (
        <WeeklySummaryModal 
            events={categorizedEvents.currentWeek} 
            onClose={() => setIsSummaryModalOpen(false)} 
        />
      )}
    </div>
  );
}
