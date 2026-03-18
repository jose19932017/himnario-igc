import { useState, useMemo, useRef, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Constantes locales ───────────────────────────────────────────
const ADMIN_PASSWORD  = "5555";
const FAVORITES_KEY   = "himnario_igc_favorites";

// ─── Helpers de fecha ─────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[m - 1]} ${y}`;
}
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, min] = timeStr.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}
function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") >= now;
}

// ─── Iconos ───────────────────────────────────────────────────────
const HeartIcon = ({ filled, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const MusicIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const BellIcon = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const MegaphoneIcon = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11l19-9v20L3 13"/><path d="M11 12.5v4"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const TypeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);
const LockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CloudIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

// ─── PIN Modal ────────────────────────────────────────────────────
function PasswordModal({ onSuccess, onCancel }) {
  const [pin, setPin]     = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PASSWORD) { onSuccess(); }
        else {
          setShake(true); setError(true);
          setTimeout(() => { setPin(""); setShake(false); }, 700);
        }
      }, 150);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{ background:"#fff", borderRadius:20, padding:"34px 26px", maxWidth:290, width:"100%", textAlign:"center", boxShadow:"0 24px 60px rgba(0,0,0,.18)" }}>
        <div style={{ color:"#a07840", marginBottom:8, display:"flex", justifyContent:"center" }}><LockIcon /></div>
        <h3 style={{ fontFamily:"'Cinzel',serif", color:"#2c2416", margin:"0 0 4px", fontSize:15 }}>Administración</h3>
        <p style={{ color:"#9a7a50", fontSize:12, margin:"0 0 22px" }}>Ingresa el PIN de acceso</p>
        <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:24, animation: shake ? "shake 0.5s ease" : "none" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:13, height:13, borderRadius:"50%", background: pin.length>i ? (error?"#e74c3c":"#a07840") : "transparent", border:`2px solid ${pin.length>i?(error?"#e74c3c":"#a07840"):"#ccc3b0"}`, transition:"all 0.15s" }} />
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleDigit(String(n))}
              style={{ background:"#faf7f2", border:"1px solid #e8e0d0", borderRadius:10, padding:"13px 0", fontSize:17, color:"#2c2416", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.background="#f0e8d8"}
              onMouseLeave={e => e.currentTarget.style.background="#faf7f2"}>{n}</button>
          ))}
          <button onClick={onCancel} style={{ background:"#fff5f5", border:"1px solid #ffd5d5", borderRadius:10, padding:"13px 0", fontSize:11, color:"#e74c3c", cursor:"pointer" }}>Cancelar</button>
          <button onClick={() => handleDigit("0")} style={{ background:"#faf7f2", border:"1px solid #e8e0d0", borderRadius:10, padding:"13px 0", fontSize:17, color:"#2c2416", cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background="#f0e8d8"}
            onMouseLeave={e => e.currentTarget.style.background="#faf7f2"}>0</button>
          <button onClick={() => setPin(p => p.slice(0,-1))} style={{ background:"#faf7f2", border:"1px solid #e8e0d0", borderRadius:10, padding:"13px 0", fontSize:16, color:"#7a5c2e", cursor:"pointer" }}>⌫</button>
        </div>
        {error && <p style={{ color:"#e74c3c", fontSize:12, margin:"12px 0 0" }}>PIN incorrecto. Intenta de nuevo.</p>}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {

  // ── Firebase: cantos (tiempo real) ──
  const [songs, setSongs]       = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "songs"), orderBy("number", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSongs(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      setSongsLoading(false);
    }, (err) => {
      console.error("Error cargando cantos:", err);
      setSongsLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Firebase: anuncios (tiempo real) ──
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      setAnnLoading(false);
    }, (err) => {
      console.error("Error cargando anuncios:", err);
      setAnnLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Favoritos: localStorage por dispositivo ──
  const [favorites, setFavorites] = useState(() => {
    try { const s = localStorage.getItem(FAVORITES_KEY); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const isFav = (id) => favorites.includes(id);
  const toggleFavorite = (id, e) => {
    e && e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const upcomingEvents = useMemo(
    () => announcements.filter(a => a.date && isUpcoming(a.date)).sort((a,b) => (a.date||"").localeCompare(b.date||"")),
    [announcements]
  );

  // ── UI state ──
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [activeView, setActiveView]       = useState("announcements");
  const [selectedSong, setSelectedSong]   = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [fontSize, setFontSize]           = useState(16);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal]   = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [adminTab, setAdminTab]           = useState("songs");

  // ── Admin song form ──
  const [showSongForm, setShowSongForm]   = useState(false);
  const [editingSong, setEditingSong]     = useState(null);
  const [deleteSongId, setDeleteSongId]   = useState(null);
  const [showBulk, setShowBulk]           = useState(false);
  const [bulkText, setBulkText]           = useState("");
  const [bulkResult, setBulkResult]       = useState(null);
  const [songForm, setSongForm]           = useState({ number:"", title:"", author:"", lyrics:"" });
  const [songSaving, setSongSaving]       = useState(false);

  // ── Admin announcement form ──
  const [showAnnForm, setShowAnnForm]     = useState(false);
  const [editingAnn, setEditingAnn]       = useState(null);
  const [deleteAnnId, setDeleteAnnId]     = useState(null);
  const [annForm, setAnnForm]             = useState({ title:"", body:"", date:"", time:"" });
  const [annSaving, setAnnSaving]         = useState(false);

  const fileRef = useRef();

  const songsWithFav = useMemo(() => songs.map(s => ({ ...s, favorite: isFav(s.firestoreId) })), [songs, favorites]);
  const filteredSongs = useMemo(() => {
    let list = activeView === "favorites" ? songsWithFav.filter(s => s.favorite) : songsWithFav;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || String(s.number).includes(q));
    }
    return [...list].sort((a,b) => (a.number||9999)-(b.number||9999));
  }, [songsWithFav, activeView, searchQuery]);

  // ── Navigation ──
  const handleNav = (view) => {
    if (view === "manage" && !adminUnlocked) { setShowPinModal(true); return; }
    setActiveView(view); setSelectedSong(null);
    setShowSongForm(false); setShowAnnForm(false); setShowBulk(false);
    setSidebarOpen(false); setSearchQuery(""); setShowNotifPanel(false);
  };
  const handlePinSuccess = () => {
    setAdminUnlocked(true); setShowPinModal(false);
    setActiveView("manage"); setSelectedSong(null); setSidebarOpen(false);
  };
  const lockAdmin = () => {
    setAdminUnlocked(false); setActiveView("announcements");
    setShowSongForm(false); setShowAnnForm(false); setShowBulk(false); setSidebarOpen(false);
  };

  // ── CRUD Cantos (Firestore) ──
  const startAddSong = () => {
    setEditingSong(null);
    const nextNum = songs.length > 0 ? Math.max(...songs.map(s => s.number||0)) + 1 : 1;
    setSongForm({ number: String(nextNum), title:"", author:"", lyrics:"" });
    setShowSongForm(true); setShowBulk(false); setShowAnnForm(false);
  };
  const startEditSong = (song) => {
    setEditingSong(song);
    setSongForm({ number: String(song.number||""), title: song.title, author: song.author||"", lyrics: song.lyrics });
    setShowSongForm(true); setShowBulk(false); setShowAnnForm(false);
  };
  const saveSong = async () => {
    if (!songForm.title.trim() || !songForm.lyrics.trim()) return;
    setSongSaving(true);
    const data = { number: parseInt(songForm.number)||0, title: songForm.title.trim(), author: songForm.author.trim(), lyrics: songForm.lyrics.trim() };
    try {
      if (editingSong) {
        await updateDoc(doc(db, "songs", editingSong.firestoreId), data);
      } else {
        await addDoc(collection(db, "songs"), data);
      }
      setShowSongForm(false); setEditingSong(null);
    } catch (e) { console.error("Error guardando canto:", e); alert("Error al guardar. Revisa la conexión."); }
    finally { setSongSaving(false); }
  };
  const deleteSong = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "songs", firestoreId));
      setFavorites(prev => prev.filter(f => f !== firestoreId));
    } catch (e) { console.error("Error eliminando canto:", e); }
    setDeleteSongId(null);
  };

  // ── Bulk import → Firestore ──
  const parseBulkText = async () => {
    // ── Nuevo formato flexible ──────────────────────────────────────
    // Un canto nuevo se detecta por CUALQUIERA de estas dos formas:
    //   1. Línea que empieza con "---"  (separador guion medio)
    //   2. Línea que empieza y termina con comillas: "Nombre del Canto"
    //      opcionalmente precedida por un número:    7. "Nombre del Canto"
    //
    // Ejemplo de archivo .txt válido:
    //
    //   "Alabaré"
    //   Alabaré, alabaré a mi Señor...
    //   ---
    //   5. "Santo, Santo, Santo"
    //   Santo, santo, santo, Señor omnipotente...
    //   ---
    //   "Pescador de Hombres"
    //   Tú has venido a la orilla...
    //
    // También sigue siendo compatible con el formato anterior (TÍTULO:, NÚMERO:, etc.)
    // ───────────────────────────────────────────────────────────────

    const lines = bulkText.trim().split("\n");
    const parsed = [];
    let current = null;

    // Detecta si una línea es encabezado de canto nuevo (formato nuevo)
    const isHeader = (line) => {
      const t = line.trim();
      // "Título entre comillas" — con o sin número al inicio
      return /^(\d+[\.\-\)]?\s*)?"[^"]+"$/.test(t) || /^(\d+[\.\-\)]?\s*)?«[^»]+»$/.test(t);
    };

    // Extrae número y título de un encabezado
    const parseHeader = (line) => {
      const t = line.trim();
      const numMatch = t.match(/^(\d+)[\.\-\)]?\s*/);
      const num = numMatch ? parseInt(numMatch[1]) : 0;
      const titleMatch = t.match(/["«]([^"»]+)["»]/);
      const title = titleMatch ? titleMatch[1].trim() : "";
      return { num, title };
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();   // conserva indentación interna si la hubiera
      const trimmed = line.trim();

      // Separador "---" → cierra canto actual, el siguiente encabezado abrirá uno nuevo
      if (/^-{3,}$/.test(trimmed)) {
        // solo hace flush si ya tenemos un canto en curso
        if (current) { parsed.push(current); current = null; }
        continue;
      }

      // Encabezado nuevo: "Título" o 7. "Título"
      if (isHeader(trimmed)) {
        if (current) parsed.push(current);
        const { num, title } = parseHeader(trimmed);
        current = { title, number: num, author: "", lyrics: "" };
        continue;
      }

      // ── Compatibilidad con formato anterior (TÍTULO:, NÚMERO:, etc.) ──
      if (trimmed.startsWith("TÍTULO:"))  { if (current) parsed.push(current); current = { title: trimmed.replace("TÍTULO:","").trim(), author:"", lyrics:"", number:0 }; continue; }
      if (trimmed.startsWith("NÚMERO:")  && current) { current.number = parseInt(trimmed.replace("NÚMERO:","").trim())||0; continue; }
      if (trimmed.startsWith("AUTOR:")   && current) { current.author = trimmed.replace("AUTOR:","").trim(); continue; }
      if (trimmed.startsWith("LETRA:")   && current) { current.lyrics = trimmed.replace("LETRA:","").trim(); continue; }

      // Línea de letra normal
      if (current) {
        current.lyrics += (current.lyrics ? "\n" : "") + trimmed;
      }
    }
    if (current && current.title) parsed.push(current);

    // Filtra entradas sin título
    const valid = parsed.filter(s => s.title.trim());

    if (valid.length > 0) {
      setSongSaving(true);
      try {
        await Promise.all(valid.map(s => addDoc(collection(db, "songs"), {
          number: s.number || 0,
          title:  s.title.trim(),
          author: s.author.trim(),
          lyrics: s.lyrics.trim(),
        })));
        setBulkResult({ count: valid.length, songs: valid.map(s => s.title) });
        setBulkText("");
      } catch(e) { console.error(e); alert("Error al importar cantos."); }
      finally { setSongSaving(false); }
    } else {
      setBulkResult({ count: 0 });
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBulkText(ev.target.result);
    reader.readAsText(file); e.target.value="";
  };

  // ── CRUD Anuncios (Firestore) ──
  const startAddAnn = () => {
    setEditingAnn(null);
    setAnnForm({ title:"", body:"", date:"", time:"" });
    setShowAnnForm(true); setShowSongForm(false); setShowBulk(false);
  };
  const startEditAnn = (ann) => {
    setEditingAnn(ann);
    setAnnForm({ title: ann.title, body: ann.body||"", date: ann.date||"", time: ann.time||"" });
    setShowAnnForm(true); setShowSongForm(false); setShowBulk(false);
  };
  const saveAnn = async () => {
    if (!annForm.title.trim()) return;
    setAnnSaving(true);
    const data = { title: annForm.title.trim(), body: annForm.body.trim(), date: annForm.date, time: annForm.time, createdAt: editingAnn ? editingAnn.createdAt : serverTimestamp() };
    try {
      if (editingAnn) {
        await updateDoc(doc(db, "announcements", editingAnn.firestoreId), { title: data.title, body: data.body, date: data.date, time: data.time });
      } else {
        await addDoc(collection(db, "announcements"), data);
      }
      setShowAnnForm(false); setEditingAnn(null);
    } catch(e) { console.error("Error guardando anuncio:", e); alert("Error al guardar. Revisa la conexión."); }
    finally { setAnnSaving(false); }
  };
  const deleteAnn = async (firestoreId) => {
    try { await deleteDoc(doc(db, "announcements", firestoreId)); }
    catch (e) { console.error("Error eliminando anuncio:", e); }
    setDeleteAnnId(null);
  };

  const showSearchBar = !selectedSong && (activeView === "catalog" || activeView === "favorites");

  // ─── JSX ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Georgia',serif", height:"100vh", display:"flex", flexDirection:"column", background:"#f4f0e8", color:"#2c2416", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#ede8de;}::-webkit-scrollbar-thumb{background:#c4a878;border-radius:4px;}
        .song-card{transition:all .22s;cursor:pointer;border:1px solid #ddd3be;}
        .song-card:hover{background:#fff!important;border-color:#b8976a!important;transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.09)!important;}
        .ann-card{background:#fff;border-radius:12px;border:1px solid #ddd3be;padding:18px 20px;box-shadow:0 2px 10px rgba(0,0,0,.05);}
        .fav-btn{transition:transform .2s;background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0;}
        .fav-btn:hover{transform:scale(1.25);}
        .nav-item{transition:all .2s;cursor:pointer;display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:8px;margin-bottom:3px;border-left:3px solid transparent;}
        .nav-item:hover{background:rgba(184,151,106,.12);}
        .nav-item.active{background:rgba(184,151,106,.2);border-left-color:#a07840;color:#7a5c2e!important;}
        .btn-gold{background:#a07840;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:'Cinzel',serif;transition:background .2s,transform .15s;display:inline-flex;align-items:center;gap:6px;}
        .btn-gold:hover:not(:disabled){background:#8a6830;transform:translateY(-1px);}
        .btn-gold:disabled{opacity:.6;cursor:not-allowed;}
        .icon-btn{display:inline-flex;align-items:center;gap:5px;cursor:pointer;border-radius:6px;padding:6px 10px;border:1px solid transparent;transition:all .2s;background:none;font-size:12px;}
        .icon-btn:hover{background:rgba(184,151,106,.15);border-color:#ccc3b0;}
        .sidebar-wrap{position:fixed;top:0;left:0;height:100%;width:255px;background:#fffdf8;border-right:1px solid #ddd3be;z-index:50;display:flex;flex-direction:column;transition:transform .3s ease;padding-top:env(safe-area-inset-top);}
        .overlay-bg{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:40;}
        .slide-in{animation:slideIn .28s ease;}
        @keyframes slideIn{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input,textarea,select{background:#fff!important;color:#2c2416!important;border:1px solid #ccc3b0!important;border-radius:6px;padding:9px 13px;width:100%;font-family:'Crimson Text',serif;font-size:15px;outline:none;}
        input:focus,textarea:focus,select:focus{border-color:#a07840!important;box-shadow:0 0 0 3px rgba(160,120,64,.1);}
        textarea{resize:vertical;}
        .range-slider{-webkit-appearance:none;appearance:none;height:4px;background:#ddd3be;border-radius:2px;outline:none;width:100%;}
        .range-slider::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;background:#a07840;border-radius:50%;cursor:pointer;}
        .num-badge{display:inline-flex;align-items:center;justify-content:center;background:#a07840;color:#fff;border-radius:6px;min-width:28px;height:21px;font-size:10px;font-family:'Cinzel',serif;font-weight:700;padding:0 5px;}
        .admin-tab{padding:8px 16px;border:none;cursor:pointer;font-family:'Cinzel',serif;font-size:12px;border-radius:6px;transition:all .2s;}
        .admin-tab.active{background:#a07840;color:#fff;}
        .admin-tab:not(.active){background:none;color:#9a7a50;}
        .admin-tab:not(.active):hover{background:rgba(184,151,106,.12);}
        .notif-panel{position:fixed;top:56px;right:12px;width:300px;background:#fff;border:1px solid #ddd3be;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:60;animation:fadeIn .2s;}
        .date-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(160,120,64,.1);color:#7a5c2e;border:1px solid rgba(160,120,64,.25);border-radius:20px;padding:3px 10px;font-size:11px;}
        .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
      `}</style>

      {showPinModal && <PasswordModal onSuccess={handlePinSuccess} onCancel={() => setShowPinModal(false)} />}
      {sidebarOpen && <div className="overlay-bg" onClick={() => setSidebarOpen(false)} />}
      {showNotifPanel && <div style={{ position:"fixed", inset:0, zIndex:55 }} onClick={() => setShowNotifPanel(false)} />}

      {/* ── SIDEBAR ── */}
      <div className="sidebar-wrap" style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid #ddd3be", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700, color:"#7a5c2e", letterSpacing:1 }}>Himnario IGC</div>
          <button onClick={() => setSidebarOpen(false)} style={{ background:"none", border:"none", color:"#b8976a", cursor:"pointer" }}><CloseIcon /></button>
        </div>
        <nav style={{ flex:1, padding:"14px 10px", overflowY:"auto" }}>
          {[
            { id:"announcements", icon:<MegaphoneIcon />,          label:"Anuncios" },
            { id:"catalog",       icon:<MusicIcon />,              label:"Himnario" },
            { id:"favorites",     icon:<HeartIcon filled size={19}/>, label:"Mis Favoritos" },
            { id:"manage",        icon:<PlusIcon />,               label:"Administrar", locked:!adminUnlocked },
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeView===item.id?"active":""}`}
              onClick={() => handleNav(item.id)}
              style={{ color: activeView===item.id ? "#7a5c2e" : "#9a7a50" }}>
              {item.icon}
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:13, flex:1 }}>{item.label}</span>
              {item.locked && <span style={{ fontSize:12 }}>🔒</span>}
            </div>
          ))}
        </nav>
        {adminUnlocked && (
          <div style={{ padding:"12px 14px", borderTop:"1px solid #ddd3be" }}>
            <button className="icon-btn" onClick={lockAdmin}
              style={{ color:"#c0392b", width:"100%", justifyContent:"center", border:"1px solid #ffd5d5", borderRadius:8, padding:"9px 0", fontFamily:"'Cinzel',serif", fontSize:12 }}>
              <LogoutIcon /> Cerrar sesión admin
            </button>
          </div>
        )}
        <div style={{ padding:"10px 18px", borderTop:"1px solid #ede8de", display:"flex", alignItems:"center", gap:6 }}>
          <CloudIcon />
          <span style={{ fontSize:11, color:"#c4a878" }}>{songs.length} cantos · {favorites.length} favoritos</span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header style={{ flexShrink:0, background:"#fffdf8", borderBottom:"1px solid #ddd3be", paddingLeft:16, paddingRight:16, paddingTop:"max(env(safe-area-inset-top), 44px)", paddingBottom:0, minHeight:"calc(56px + max(env(safe-area-inset-top), 44px))", display:"flex", alignItems:"flex-end", gap:10, boxShadow:"0 2px 8px rgba(0,0,0,.05)", zIndex:30 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", color:"#a07840", cursor:"pointer", padding:4, display:"flex" }}><MenuIcon /></button>
        <span style={{ fontFamily:"'Cinzel',serif", fontSize:17, fontWeight:700, color:"#7a5c2e", letterSpacing:2 }}>HIMNARIO IGC</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {/* Bell */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowNotifPanel(p=>!p)}
              style={{ background:"none", border:"none", color: upcomingEvents.length>0 ? "#a07840" : "#c4a878", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center", position:"relative" }}>
              <BellIcon size={20} />
              {upcomingEvents.length > 0 && (
                <span style={{ position:"absolute", top:2, right:2, background:"#e74c3c", color:"#fff", borderRadius:"50%", width:14, height:14, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                  {upcomingEvents.length}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <div className="notif-panel">
                <div style={{ padding:"14px 16px", borderBottom:"1px solid #ede8de" }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#7a5c2e", fontWeight:600 }}>Próximos Eventos</div>
                </div>
                {upcomingEvents.length === 0
                  ? <div style={{ padding:"20px 16px", textAlign:"center", color:"#c4a878", fontSize:13 }}>Sin eventos próximos</div>
                  : <div style={{ maxHeight:300, overflowY:"auto" }}>
                      {upcomingEvents.map(ev => (
                        <div key={ev.firestoreId} style={{ padding:"12px 16px", borderBottom:"1px solid #f4f0e8" }}>
                          <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#2c2416", marginBottom:4 }}>{ev.title}</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <span className="date-chip"><CalendarIcon /> {formatDate(ev.date)}</span>
                            {ev.time && <span className="date-chip"><ClockIcon /> {formatTime(ev.time)}</span>}
                          </div>
                          {ev.body && <div style={{ fontSize:12, color:"#9a7a50", marginTop:6, lineHeight:1.5 }}>{ev.body}</div>}
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}
          </div>
          {adminUnlocked && (
            <>
              <span style={{ background:"#fff8e0", border:"1px solid #e8c84a", borderRadius:20, padding:"2px 10px", color:"#7a6010", fontSize:11, fontFamily:"'Cinzel',serif" }}>Admin</span>
              <button onClick={lockAdmin} style={{ background:"none", border:"1px solid #ffd5d5", borderRadius:8, padding:"4px 10px", color:"#c0392b", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", gap:5 }}>
                <LogoutIcon /> Salir
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── SEARCH BAR ── */}
      {showSearchBar && (
        <div style={{ flexShrink:0, background:"#f4f0e8", borderBottom:"1px solid #e8e0d0", padding:"10px 20px", zIndex:20 }}>
          <div style={{ maxWidth:860, margin:"0 auto" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#b8976a", marginBottom:7, letterSpacing:1 }}>
              {activeView==="favorites" ? "MIS FAVORITOS" : "HIMNARIO"}
              <span style={{ fontWeight:400, marginLeft:8, fontSize:11 }}>— {filteredSongs.length} cantos</span>
            </div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#c4a878", pointerEvents:"none", display:"flex" }}><SearchIcon /></div>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por número o título..." style={{ paddingLeft:38, fontSize:14 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>

          {/* Loading state */}
          {(songsLoading || annLoading) && !selectedSong && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#c4a878" }}>
              <div style={{ display:"inline-block", width:32, height:32, border:"3px solid #ddd3be", borderTopColor:"#a07840", borderRadius:"50%", animation:"spin .8s linear infinite", marginBottom:14 }} />
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:13 }}>Cargando desde la nube...</div>
            </div>
          )}

          {/* ── SONG DETAIL ── */}
          {!songsLoading && selectedSong && (
            <div className="slide-in">
              <button onClick={() => setSelectedSong(null)} style={{ background:"none", border:"none", color:"#9a7a50", cursor:"pointer", display:"flex", alignItems:"center", gap:5, marginBottom:20, padding:0, fontSize:14 }}>
                <ChevronLeft /> Volver al himnario
              </button>
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #ddd3be", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
                <div style={{ padding:"26px 28px", borderBottom:"1px solid #ede8de", background:"linear-gradient(135deg,#faf7f2,#fff)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <span className="num-badge" style={{ marginBottom:12, display:"inline-block" }}>#{selectedSong.number}</span>
                      <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:24, fontWeight:700, color:"#2c2416", margin:"0 0 6px", lineHeight:1.3 }}>{selectedSong.title}</h1>
                      {selectedSong.author && <div style={{ color:"#9a7a50", fontSize:13, fontStyle:"italic" }}>— {selectedSong.author}</div>}
                    </div>
                    <button className="fav-btn" onClick={e=>toggleFavorite(selectedSong.firestoreId,e)} style={{ color:isFav(selectedSong.firestoreId)?"#e74c3c":"#ccc3b0", marginLeft:12 }}>
                      <HeartIcon filled={isFav(selectedSong.firestoreId)} size={26} />
                    </button>
                  </div>
                  <div style={{ marginTop:18, display:"flex", alignItems:"center", gap:10 }}>
                    <TypeIcon />
                    <span style={{ color:"#c4a878", fontSize:12, minWidth:52 }}>A {fontSize}px</span>
                    <input type="range" min="12" max="28" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} className="range-slider" style={{ flex:1, maxWidth:180 }} />
                    <span style={{ color:"#a07840", fontSize:19, fontWeight:700 }}>A</span>
                  </div>
                </div>
                <div style={{ padding:"28px" }}>
                  <pre style={{ fontFamily:"'Crimson Text',serif", fontSize:fontSize, lineHeight:1.95, color:"#2c2416", whiteSpace:"pre-wrap", margin:0 }}>
                    {selectedSong.lyrics}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {!annLoading && !selectedSong && activeView === "announcements" && (
            <div className="slide-in">
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"#b8976a", letterSpacing:1, marginBottom:4 }}>ANUNCIOS</div>
                <div style={{ width:32, height:2, background:"#b8976a", borderRadius:1 }} />
              </div>
              {announcements.length === 0
                ? <div style={{ textAlign:"center", padding:"60px 20px", color:"#c4a878" }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>📢</div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:15 }}>No hay anuncios por ahora</div>
                  </div>
                : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {announcements.map((ann, idx) => (
                      <div key={ann.firestoreId} className="ann-card" style={{ animation:`slideIn .3s ease ${idx*.05}s both` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                          <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:15, color:"#2c2416", margin:0, lineHeight:1.35, flex:1 }}>{ann.title}</h3>
                          <span style={{ fontSize:18, flexShrink:0 }}>📢</span>
                        </div>
                        {ann.body && <p style={{ margin:"10px 0 0", color:"#5a4a38", fontSize:14, lineHeight:1.7, fontFamily:"'Crimson Text',serif" }}>{ann.body}</p>}
                        {(ann.date || ann.time) && (
                          <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                            {ann.date && <span className="date-chip"><CalendarIcon /> {formatDate(ann.date)}</span>}
                            {ann.time && <span className="date-chip"><ClockIcon /> {formatTime(ann.time)}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── MANAGE ── */}
          {!selectedSong && activeView === "manage" && (
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"#b8976a", marginBottom:16, letterSpacing:1 }}>ADMINISTRAR</div>
              <div style={{ display:"flex", gap:6, marginBottom:20, background:"#ede8de", borderRadius:8, padding:4, width:"fit-content" }}>
                <button className={`admin-tab ${adminTab==="songs"?"active":""}`} onClick={() => { setAdminTab("songs"); setShowSongForm(false); setShowAnnForm(false); setShowBulk(false); }}>Cantos</button>
                <button className={`admin-tab ${adminTab==="announcements"?"active":""}`} onClick={() => { setAdminTab("announcements"); setShowSongForm(false); setShowAnnForm(false); setShowBulk(false); }}>Anuncios</button>
              </div>

              {/* Songs tab */}
              {adminTab === "songs" && !songsLoading && (
                <div>
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    <button className="btn-gold" onClick={startAddSong} style={{ padding:"9px 16px", fontSize:13 }}><PlusIcon /> Agregar Canto</button>
                    <button className="icon-btn" onClick={() => { setShowBulk(!showBulk); setShowSongForm(false); }} style={{ color:"#7a5c2e", border:"1px solid #ccc3b0" }}><UploadIcon /> Carga Masiva</button>
                  </div>

                  {showBulk && (
                    <div style={{ background:"#fffdf8", border:"1px solid #ddd3be", borderRadius:10, padding:"18px", marginBottom:14 }}>
                      <h3 style={{ fontFamily:"'Cinzel',serif", color:"#7a5c2e", margin:"0 0 12px", fontSize:13 }}>Carga Masiva</h3>
                      <div style={{ background:"#faf7f2", border:"1px dashed #ccc3b0", borderRadius:7, padding:12, fontFamily:"monospace", fontSize:11, color:"#9a8a6e", whiteSpace:"pre", marginBottom:12, lineHeight:1.9 }}>{`Formato nuevo (recomendado):

"Nombre del Canto"
Primera línea de la letra
Segunda línea...
---
5. "Otro Canto con número"
Letra del segundo canto...
---
"Tercer Canto"
Letra del tercer canto...

El número antes de las comillas es opcional.
Separa cada canto con --- (tres guiones).`}</div>
                      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                        <button className="icon-btn" onClick={() => fileRef.current?.click()} style={{ color:"#7a5c2e", border:"1px solid #ccc3b0" }}><UploadIcon /> Cargar .txt</button>
                        <input ref={fileRef} type="file" accept=".txt" onChange={handleFileUpload} style={{ display:"none" }} />
                      </div>
                      <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder={`"Alabaré"\nAlabaré, alabaré a mi Señor...\n---\n5. "Santo, Santo, Santo"\nSanto, santo, santo, Señor omnipotente...`} style={{ minHeight:140, marginBottom:10, fontSize:13 }} />
                      <button className="btn-gold" onClick={parseBulkText} disabled={songSaving} style={{ padding:"8px 16px", fontSize:12 }}>
                        {songSaving ? <span className="spinner" /> : "Importar"}
                      </button>
                      {bulkResult && (
                        <div style={{ marginTop:10, padding:"9px 12px", background: bulkResult.count>0?"rgba(46,125,50,.08)":"rgba(183,28,28,.08)", border:`1px solid ${bulkResult.count>0?"#81c784":"#ef9a9a"}`, borderRadius:7, color: bulkResult.count>0?"#2e7d32":"#c0392b", fontSize:12 }}>
                          {bulkResult.count>0 ? `✓ ${bulkResult.count} canto(s) guardados en la nube` : "✗ Formato no reconocido."}
                        </div>
                      )}
                    </div>
                  )}

                  {showSongForm && (
                    <div style={{ background:"#fffdf8", border:"1px solid #ddd3be", borderRadius:10, padding:"18px", marginBottom:14 }}>
                      <h3 style={{ fontFamily:"'Cinzel',serif", color:"#7a5c2e", margin:"0 0 14px", fontSize:13 }}>{editingSong?"Editar Canto":"Nuevo Canto"}</h3>
                      <div style={{ display:"grid", gridTemplateColumns:"72px 1fr", gap:10, marginBottom:10 }}>
                        <div>
                          <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>N°</label>
                          <input type="number" value={songForm.number} onChange={e=>setSongForm(p=>({...p,number:e.target.value}))} min="1" style={{ textAlign:"center" }} />
                        </div>
                        <div>
                          <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>TÍTULO *</label>
                          <input value={songForm.title} onChange={e=>setSongForm(p=>({...p,title:e.target.value}))} placeholder="Nombre del canto" />
                        </div>
                      </div>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>AUTOR</label>
                        <input value={songForm.author} onChange={e=>setSongForm(p=>({...p,author:e.target.value}))} placeholder="Compositor o autor" />
                      </div>
                      <div style={{ marginBottom:14 }}>
                        <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>LETRA *</label>
                        <textarea value={songForm.lyrics} onChange={e=>setSongForm(p=>({...p,lyrics:e.target.value}))} placeholder="Letra completa..." style={{ minHeight:160, fontSize:14 }} />
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button className="btn-gold" onClick={saveSong} disabled={songSaving} style={{ padding:"8px 16px", fontSize:12 }}>
                          {songSaving ? <span className="spinner" /> : (editingSong?"Guardar cambios":"Agregar canto")}
                        </button>
                        <button onClick={() => { setShowSongForm(false); setEditingSong(null); }} style={{ background:"none", border:"1px solid #ccc3b0", borderRadius:8, padding:"8px 14px", color:"#9a7a50", cursor:"pointer", fontSize:12 }}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {songs.map(song => (
                      <div key={song.firestoreId} style={{ background:"#fff", border:"1px solid #ddd3be", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span className="num-badge">#{song.number||"—"}</span>
                          <div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"#2c2416" }}>{song.title}</div>
                            {song.author && <div style={{ fontSize:11, color:"#9a7a50", fontStyle:"italic" }}>{song.author}</div>}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="icon-btn" onClick={()=>startEditSong(song)} style={{ color:"#7a5c2e" }}><EditIcon /> Editar</button>
                          <button className="icon-btn" onClick={()=>setDeleteSongId(song.firestoreId)} style={{ color:"#e74c3c" }}><TrashIcon /> Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements tab */}
              {adminTab === "announcements" && !annLoading && (
                <div>
                  <div style={{ marginBottom:14 }}>
                    <button className="btn-gold" onClick={startAddAnn} style={{ padding:"9px 16px", fontSize:13 }}><PlusIcon /> Agregar Anuncio</button>
                  </div>

                  {showAnnForm && (
                    <div style={{ background:"#fffdf8", border:"1px solid #ddd3be", borderRadius:10, padding:"18px", marginBottom:14 }}>
                      <h3 style={{ fontFamily:"'Cinzel',serif", color:"#7a5c2e", margin:"0 0 14px", fontSize:13 }}>{editingAnn?"Editar Anuncio":"Nuevo Anuncio"}</h3>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>TÍTULO *</label>
                        <input value={annForm.title} onChange={e=>setAnnForm(p=>({...p,title:e.target.value}))} placeholder="Título del anuncio" />
                      </div>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>DESCRIPCIÓN</label>
                        <textarea value={annForm.body} onChange={e=>setAnnForm(p=>({...p,body:e.target.value}))} placeholder="Detalles del anuncio (opcional)..." style={{ minHeight:90, fontSize:14 }} />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                        <div>
                          <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>FECHA (opcional)</label>
                          <input type="date" value={annForm.date} onChange={e=>setAnnForm(p=>({...p,date:e.target.value}))} />
                        </div>
                        <div>
                          <label style={{ fontSize:10, color:"#9a7a50", display:"block", marginBottom:4, fontFamily:"'Cinzel',serif" }}>HORA (opcional)</label>
                          <input type="time" value={annForm.time} onChange={e=>setAnnForm(p=>({...p,time:e.target.value}))} />
                        </div>
                      </div>
                      {annForm.date && (
                        <div style={{ marginBottom:14, padding:"8px 12px", background:"rgba(160,120,64,.08)", border:"1px solid rgba(160,120,64,.2)", borderRadius:7, fontSize:12, color:"#7a5c2e", display:"flex", alignItems:"center", gap:6 }}>
                          <BellIcon size={13} /> Este anuncio aparecerá en las notificaciones de la campana.
                        </div>
                      )}
                      <div style={{ display:"flex", gap:8 }}>
                        <button className="btn-gold" onClick={saveAnn} disabled={annSaving} style={{ padding:"8px 16px", fontSize:12 }}>
                          {annSaving ? <span className="spinner" /> : (editingAnn?"Guardar cambios":"Publicar anuncio")}
                        </button>
                        <button onClick={() => { setShowAnnForm(false); setEditingAnn(null); }} style={{ background:"none", border:"1px solid #ccc3b0", borderRadius:8, padding:"8px 14px", color:"#9a7a50", cursor:"pointer", fontSize:12 }}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {announcements.map(ann => (
                      <div key={ann.firestoreId} style={{ background:"#fff", border:"1px solid #ddd3be", borderRadius:10, padding:"13px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:6 }}>
                          <div style={{ fontFamily:"'Cinzel',serif", fontSize:13, color:"#2c2416", flex:1 }}>{ann.title}</div>
                          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                            <button className="icon-btn" onClick={()=>startEditAnn(ann)} style={{ color:"#7a5c2e" }}><EditIcon /> Editar</button>
                            <button className="icon-btn" onClick={()=>setDeleteAnnId(ann.firestoreId)} style={{ color:"#e74c3c" }}><TrashIcon /> Eliminar</button>
                          </div>
                        </div>
                        {ann.body && <div style={{ fontSize:12, color:"#9a7a50", lineHeight:1.5, marginBottom:8 }}>{ann.body}</div>}
                        <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                          {ann.date
                            ? <span className="date-chip"><CalendarIcon /> {formatDate(ann.date)} {ann.time && `· ${formatTime(ann.time)}`}</span>
                            : <span style={{ fontSize:11, color:"#c4a878" }}>Sin fecha</span>
                          }
                          {ann.date && isUpcoming(ann.date) && (
                            <span style={{ fontSize:10, background:"rgba(231,76,60,.1)", color:"#c0392b", border:"1px solid rgba(231,76,60,.2)", borderRadius:20, padding:"2px 8px" }}>🔔 En notificaciones</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CATALOG / FAVORITES ── */}
          {!songsLoading && !selectedSong && (activeView === "catalog" || activeView === "favorites") && (
            filteredSongs.length === 0
              ? <div style={{ textAlign:"center", padding:"70px 20px", color:"#c4a878" }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>♪</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:15 }}>{activeView==="favorites" ? "Aún no tienes favoritos" : "No se encontraron cantos"}</div>
                  {activeView==="favorites" && <div style={{ fontSize:12, marginTop:8, color:"#d4c4a8" }}>Toca el corazón en cualquier canto para guardarlo aquí</div>}
                </div>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:12 }}>
                  {filteredSongs.map(song => (
                    <div key={song.firestoreId} className="song-card" onClick={()=>{ setSelectedSong(song); setSidebarOpen(false); }}
                      style={{ background:"#fff", borderRadius:10, padding:"15px 16px", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1, paddingRight:8, minWidth:0 }}>
                          <span className="num-badge" style={{ marginBottom:9, display:"inline-block" }}>#{song.number||"—"}</span>
                          <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:14, color:"#2c2416", margin:"0 0 6px", fontWeight:600, lineHeight:1.35 }}>{song.title}</h3>
                          <div style={{ fontSize:12, color:"#c4a878", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                            {song.lyrics.split("\n")[0]}
                          </div>
                        </div>
                        <button className="fav-btn" onClick={e=>toggleFavorite(song.firestoreId,e)} style={{ color:song.favorite?"#e74c3c":"#d4c4a8" }}>
                          <HeartIcon filled={song.favorite} size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
          )}

        </div>
      </div>

      {/* ── DELETE MODALS ── */}
      {(deleteSongId || deleteAnnId) && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.42)", zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .2s" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"26px 24px", maxWidth:320, width:"100%", textAlign:"center", boxShadow:"0 12px 40px rgba(0,0,0,.14)" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
            <h3 style={{ fontFamily:"'Cinzel',serif", color:"#2c2416", margin:"0 0 7px", fontSize:14 }}>{deleteSongId ? "¿Eliminar canto?" : "¿Eliminar anuncio?"}</h3>
            <p style={{ color:"#9a7a50", fontSize:12, marginBottom:20 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              <button onClick={() => deleteSongId ? deleteSong(deleteSongId) : deleteAnn(deleteAnnId)}
                style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:12 }}>Eliminar</button>
              <button onClick={() => { setDeleteSongId(null); setDeleteAnnId(null); }}
                style={{ background:"none", border:"1px solid #ccc3b0", borderRadius:8, padding:"9px 16px", color:"#9a7a50", cursor:"pointer", fontSize:12 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
