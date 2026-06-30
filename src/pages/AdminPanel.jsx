/**
 * AdminPanel.jsx — Full admin management UI.
 * 
 * Fixes vs original:
 * 1. Bulk upload now calls POST /admin/questions/upload-excel (multipart/form-data).
 *    The endpoint now EXISTS in admin.py.
 * 2. All category values are sent lowercase to match backend enum values.
 * 3. Access code status is fetched fresh on every tab switch (auto-sync fix).
 * 4. Results table now shows real correct_answers and score_percentage from backend.
 * 5. `correct_answers` column was always 0 — now populated by API (backend fixed).
 * 6. Pagination: total_pages floor-division corrected for small datasets.
 * 7. Edit modal pre-populates session_start/session_end as datetime-local strings.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faGraduationCap,
  faUsers,
  faClock,
  faFileAlt,
  faList,
  faCalendarAlt,
  faHourglassHalf,
  faSignOutAlt,
  faCheckCircle,
  faExclamationTriangle,
  faSpinner,
  faArrowLeft,
  faEdit,
  faTrash,
  faPlus,
  faUpload,
  faDownload,
  faTrophy,
  faAward,
  faShieldAlt,
  faUser,
  faEnvelope,
  faChartBar,
  faDatabase,
  faRefresh,
  faSearch,
  faFilter,
  faTimes,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: '',            label: 'Semua Kategori (Tidak Dibatasi)' },
  { value: 'indonesian',  label: '🇮🇩 Bahasa Indonesia' },
  { value: 'english',     label: '🇬🇧 Bahasa Inggris' },
  { value: 'mathematics', label: '📐 Matematika' },
  { value: 'physics',     label: '⚛️ Fisika' },
  { value: 'chemistry',   label: '🧪 Kimia' },
  { value: 'biology',     label: '🧬 Biologi' },
  { value: 'history',     label: '📜 Sejarah' },
  { value: 'geography',   label: '🌍 Geografi' },
  { value: 'economics',   label: '💰 Ekonomi' },
  { value: 'sociology',   label: '👥 Sosiologi' },
  { value: 'other',       label: '📚 Lainnya' },
];

const CATEGORY_ICONS = {
  indonesian: '🇮🇩', english: '🇬🇧', mathematics: '📐', physics: '⚛️',
  chemistry: '🧪', biology: '🧬', history: '📜', geography: '🌍',
  economics: '💰', sociology: '👥', other: '📚',
};

const CATEGORY_COLORS = {
  indonesian:  'bg-red-100 text-red-700 border-red-300',
  english:     'bg-blue-100 text-blue-700 border-blue-300',
  mathematics: 'bg-purple-100 text-purple-700 border-purple-300',
  physics:     'bg-indigo-100 text-indigo-700 border-indigo-300',
  chemistry:   'bg-green-100 text-green-700 border-green-300',
  biology:     'bg-emerald-100 text-emerald-700 border-emerald-300',
  history:     'bg-amber-100 text-amber-700 border-amber-300',
  geography:   'bg-cyan-100 text-cyan-700 border-cyan-300',
  economics:   'bg-lime-100 text-lime-700 border-lime-300',
  sociology:   'bg-pink-100 text-pink-700 border-pink-300',
  other:       'bg-gray-100 text-gray-700 border-gray-300',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getCategoryLabel = v =>
  CATEGORY_OPTIONS.find(o => o.value === (v || ''))?.label ?? v ?? '–';

const getCategoryBadge = v =>
  CATEGORY_COLORS[v] ?? 'bg-gray-100 text-gray-600 border-gray-300';

const getCategoryIcon = v => CATEGORY_ICONS[v] ?? '📋';

/** Convert a JS Date / ISO string to the value expected by <input type="datetime-local"> */
const toDatetimeLocal = iso => {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
};

// ---------------------------------------------------------------------------
// Blank form factories (avoids stale object references)
// ---------------------------------------------------------------------------

const blankCodeForm = () => ({
  code: '', description: '', category: '',
  session_start: '', session_end: '',
  duration_minutes: 60, max_participants: 10,
});

const blankQuestionForm = (defaultCategory = 'indonesian') => ({
  question_text: '', category: defaultCategory,
  options: ['', '', '', ''],
  correct_answer_index: 0, points: 1, order_index: 0,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminPanel = () => {
  const navigate = useNavigate();

  // ---- UI state ----
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);

  // ---- Dashboard ----
  const [stats, setStats] = useState({
    total_access_codes: 0, active_access_codes: 0,
    total_participants: 0, active_participants: 0,
    total_questions: 0,    average_score: 0,
    completion_rate: 0,    category_stats: {},
  });

  // ---- Access codes ----
  const [accessCodes,              setAccessCodes]              = useState([]);
  const [accessCodeForm,           setAccessCodeForm]           = useState(blankCodeForm());
  const [editingAccessCode,        setEditingAccessCode]        = useState(null);
  const [showEditAccessCodeModal,  setShowEditAccessCodeModal]  = useState(false);

  // ---- Questions ----
  const [questions,                    setQuestions]                    = useState([]);
  const [selectedAccessCodeId,         setSelectedAccessCodeId]         = useState(null);
  const [accessCodeCategory,           setAccessCodeCategory]           = useState('');
  const [questionForm,                 setQuestionForm]                 = useState(blankQuestionForm());
  const [editingQuestion,              setEditingQuestion]              = useState(null);
  const [showQuestionForm,             setShowQuestionForm]             = useState(false);
  const [showEditQuestionModal,        setShowEditQuestionModal]        = useState(false);

  // ---- Results ----
  const [results,                setResults]                = useState([]);
  const [selectedResultsCodeId,  setSelectedResultsCodeId]  = useState(null);

  // ---- Logs ----
  const [logs,       setLogs]       = useState([]);
  const [logType,    setLogType]    = useState('');

  const fileInputRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Auth guard
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      const key = prompt('Enter Admin Access Key:');
      if (key === (import.meta.env.VITE_ADMIN_SECRET_KEY || 'admin123')) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        navigate('/');
      }
    }
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // Notification helpers
  // ---------------------------------------------------------------------------

  const notify = (type, msg) => {
    if (type === 'error')   { setError(msg);   setSuccess(null); }
    if (type === 'success') { setSuccess(msg); setError(null);   }
  };
  const clearNotices = () => { setError(null); setSuccess(null); };

  // ---------------------------------------------------------------------------
  // Data fetchers
  // ---------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/dashboard/stats');
      setStats(data);
    } catch { notify('error', 'Failed to load dashboard statistics'); }
  }, []);

  const fetchAccessCodes = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/access-codes?per_page=200');
      setAccessCodes(data.items ?? []);
    } catch { notify('error', 'Failed to load access codes'); }
  }, []);

  const fetchQuestions = useCallback(async id => {
    const codeId = id ?? selectedAccessCodeId;
    if (!codeId) return;
    try {
      const { data } = await api.get(`/admin/questions?access_code_id=${codeId}&per_page=500`);
      setQuestions(data.items ?? []);

      // Sync form category to access code's category
      const code = accessCodes.find(c => c.id === codeId);
      const cat  = code?.category ?? '';
      setAccessCodeCategory(cat);
      setQuestionForm(prev => ({ ...prev, category: cat || prev.category }));
    } catch { notify('error', 'Failed to load questions'); }
  }, [selectedAccessCodeId, accessCodes]);

  const fetchResults = useCallback(async id => {
    const codeId = id ?? selectedResultsCodeId;
    if (!codeId) return;
    try {
      const { data } = await api.get(`/admin/results/${codeId}`);
      setResults(data ?? []);
    } catch { notify('error', 'Failed to load results'); }
  }, [selectedResultsCodeId]);

  const fetchLogs = useCallback(async (type = logType) => {
    try {
      const params = new URLSearchParams({ per_page: 200 });
      if (type) params.append('log_type', type);
      const { data } = await api.get(`/admin/logs?${params}`);
      setLogs(data.items ?? []);
    } catch { notify('error', 'Failed to load logs'); }
  }, [logType]);

  // ---------------------------------------------------------------------------
  // Tab switching
  // ---------------------------------------------------------------------------

  const switchTab = useCallback(async tab => {
    setActiveTab(tab);
    clearNotices();
    setIsLoading(true);
    try {
      switch (tab) {
        case 'dashboard': await fetchStats();                                             break;
        case 'codes':     await fetchAccessCodes();                                       break;
        case 'questions': await fetchAccessCodes();
                          if (selectedAccessCodeId) await fetchQuestions(selectedAccessCodeId); break;
        case 'results':   await fetchAccessCodes();
                          if (selectedResultsCodeId) await fetchResults(selectedResultsCodeId); break;
        case 'logs':      await fetchLogs();                                              break;
        default:          break;
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, fetchAccessCodes, fetchQuestions, fetchResults, fetchLogs,
      selectedAccessCodeId, selectedResultsCodeId]);

  useEffect(() => { switchTab('dashboard'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Access code CRUD
  // ---------------------------------------------------------------------------

  const handleCreateAccessCode = async e => {
    e.preventDefault();
    setIsLoading(true);
    clearNotices();
    try {
      await api.post('/admin/access-codes', {
        ...accessCodeForm,
        category:         accessCodeForm.category ? accessCodeForm.category.toLowerCase() : null,
        duration_minutes: Number(accessCodeForm.duration_minutes),
        max_participants: Number(accessCodeForm.max_participants),
      });
      notify('success', 'Access code created!');
      setAccessCodeForm(blankCodeForm());
      await fetchAccessCodes();
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to create access code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAccessCode = async e => {
    e.preventDefault();
    if (!editingAccessCode) return;
    setIsLoading(true);
    clearNotices();
    try {
      await api.put(`/admin/access-codes/${editingAccessCode.id}`, {
        description:      accessCodeForm.description,
        category:         accessCodeForm.category ? accessCodeForm.category.toLowerCase() : null,
        session_start:    accessCodeForm.session_start,
        session_end:      accessCodeForm.session_end,
        duration_minutes: Number(accessCodeForm.duration_minutes),
        max_participants: Number(accessCodeForm.max_participants),
      });
      notify('success', 'Access code updated!');
      setShowEditAccessCodeModal(false);
      setEditingAccessCode(null);
      await fetchAccessCodes();
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to update access code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccessCode = async id => {
    if (!window.confirm('Delete this access code? All associated data will be removed.')) return;
    setIsLoading(true);
    clearNotices();
    try {
      await api.delete(`/admin/access-codes/${id}`);
      notify('success', 'Access code deleted!');
      await fetchAccessCodes();
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to delete access code');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = code => {
    setEditingAccessCode(code);
    setAccessCodeForm({
      code:             code.code,
      description:      code.description ?? '',
      category:         code.category ?? '',
      session_start:    toDatetimeLocal(code.session_start),
      session_end:      toDatetimeLocal(code.session_end),
      duration_minutes: code.duration_minutes ?? 60,
      max_participants: code.max_participants ?? 10,
    });
    setShowEditAccessCodeModal(true);
  };

  // ---------------------------------------------------------------------------
  // Question CRUD
  // ---------------------------------------------------------------------------

  const handleCreateQuestion = async e => {
    e.preventDefault();
    if (!selectedAccessCodeId) { notify('error', 'Select an access code first'); return; }
    setIsLoading(true);
    clearNotices();
    try {
      const categoryToUse = (accessCodeCategory || questionForm.category || 'other').toLowerCase();
      await api.post(`/admin/questions?access_code_id=${selectedAccessCodeId}`, {
        ...questionForm,
        category:             categoryToUse,
        correct_answer_index: Number(questionForm.correct_answer_index),
        points:               Number(questionForm.points),
      });
      notify('success', 'Question created!');
      setQuestionForm(blankQuestionForm(accessCodeCategory || 'indonesian'));
      setShowQuestionForm(false);
      await fetchQuestions(selectedAccessCodeId);
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to create question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async e => {
    e.preventDefault();
    if (!editingQuestion) return;
    setIsLoading(true);
    clearNotices();
    try {
      await api.put(`/admin/questions/${editingQuestion.id}`, {
        ...questionForm,
        correct_answer_index: Number(questionForm.correct_answer_index),
        points:               Number(questionForm.points),
      });
      notify('success', 'Question updated!');
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      await fetchQuestions(selectedAccessCodeId);
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to update question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async id => {
    if (!window.confirm('Delete this question?')) return;
    setIsLoading(true);
    clearNotices();
    try {
      await api.delete(`/admin/questions/${id}`);
      notify('success', 'Question deleted!');
      await fetchQuestions(selectedAccessCodeId);
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to delete question');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditQuestionModal = q => {
    setEditingQuestion(q);
    setQuestionForm({
      question_text:        q.question_text ?? '',
      category:             q.category ?? 'indonesian',
      options:              q.options ?? ['', '', '', ''],
      correct_answer_index: q.correct_answer_index ?? 0,
      points:               q.points ?? 1,
      order_index:          q.order_index ?? 0,
    });
    setShowEditQuestionModal(true);
  };

  /**
   * FIX: Bulk upload now sends multipart/form-data to POST /admin/questions/upload-excel.
   * The backend endpoint that was missing has been added in admin.py.
   */
  const handleBulkUpload = async e => {
    const file = e.target.files?.[0];
    if (!file || !selectedAccessCodeId) return;

    setIsLoading(true);
    clearNotices();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post(
        `/admin/questions/upload-excel?access_code_id=${selectedAccessCodeId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const errCount = data.errors?.length ?? 0;
      if (errCount) {
        notify('error', `Imported ${data.created} question(s). ${errCount} row(s) had errors: ${data.errors.slice(0, 3).join('; ')}`);
      } else {
        notify('success', `Successfully imported ${data.created} question(s)!`);
      }
      await fetchQuestions(selectedAccessCodeId);
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to import questions');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Results & export
  // ---------------------------------------------------------------------------

  const handleExportExcel = async () => {
    if (!selectedResultsCodeId) { notify('error', 'Select an access code first'); return; }
    setIsLoading(true);
    clearNotices();
    try {
      const res = await api.get(`/admin/export-excel/${selectedResultsCodeId}`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',
        res.headers['content-disposition']?.split('filename=')[1]?.replace(/["']/g, '') ?? 'results.xlsx'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('success', 'Results exported!');
    } catch { notify('error', 'Failed to export results'); }
    finally { setIsLoading(false); }
  };

  // ---------------------------------------------------------------------------
  // System controls
  // ---------------------------------------------------------------------------

  const handleFlushData = async () => {
    if (!selectedResultsCodeId) { notify('error', 'Select an access code first'); return; }
    if (!window.confirm('⚠️ This will permanently delete ALL student data for this session. Continue?')) return;
    const confirmed = prompt('Type FLUSH to confirm:');
    if (confirmed !== 'FLUSH') { notify('error', 'Confirmation failed.'); return; }

    setIsLoading(true);
    clearNotices();
    try {
      const { data } = await api.post(`/admin/flush-data/${selectedResultsCodeId}?keep_questions=true`);
      notify('success', `Flushed: ${data.deleted_records?.participants ?? 0} participant(s) deleted.`);
      await fetchResults(selectedResultsCodeId);
      await fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to flush data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetExam = async () => {
    if (!selectedResultsCodeId) { notify('error', 'Select an access code first'); return; }
    if (!window.confirm('⚠️⚠️ COMPLETE RESET: removes ALL questions, answers, and participants. Irreversible!')) return;
    const confirmed = prompt('Type RESET COMPLETE to confirm:');
    if (confirmed !== 'RESET COMPLETE') { notify('error', 'Confirmation failed.'); return; }

    setIsLoading(true);
    clearNotices();
    try {
      await api.post(`/admin/reset-exam/${selectedResultsCodeId}`);
      notify('success', 'Exam completely reset!');
      setResults([]);
      await fetchAccessCodes();
      await fetchStats();
    } catch (err) {
      notify('error', err.response?.data?.detail ?? 'Failed to reset exam');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Shared UI pieces
  // ---------------------------------------------------------------------------

  const CategoryBadge = ({ category }) => {
    if (!category) return <span className="text-xs text-slate-400 italic">Tidak dibatasi</span>;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getCategoryBadge(category)}`}>
        {getCategoryIcon(category)} {getCategoryLabel(category)}
      </span>
    );
  };

  const QuestionFormFields = ({ form, setForm, lockedCategory }) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2 text-amber-500" />
          Teks Soal
        </label>
        <textarea
          value={form.question_text}
          onChange={e => setForm(prev => ({ ...prev, question_text: e.target.value }))}
          rows={3} required
          className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400/60 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
          placeholder="Masukkan teks soal..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2 text-amber-500" />
          Kategori
        </label>
        <select
          value={form.category}
          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
          disabled={!!lockedCategory}
          className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
        >
          {CATEGORY_OPTIONS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {lockedCategory && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            🔒 Terkunci ke kategori: <strong>{getCategoryLabel(lockedCategory)}</strong>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2 text-amber-500" />
          Pilihan Jawaban
        </label>
        {form.options.map((opt, idx) => (
          <input
            key={idx}
            type="text"
            value={opt}
            onChange={e => {
              const opts = [...form.options];
              opts[idx] = e.target.value;
              setForm(prev => ({ ...prev, options: opts }));
            }}
            placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
            required
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400/60 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none mb-2"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Jawaban Benar
          </label>
          <select
            value={form.correct_answer_index}
            onChange={e => setForm(prev => ({ ...prev, correct_answer_index: Number(e.target.value) }))}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
          >
            {form.options.map((_, idx) => (
              <option key={idx} value={idx}>Pilihan {String.fromCharCode(65 + idx)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            <FontAwesomeIcon icon={faAward} className="w-4 h-4 mr-2 text-amber-500" />
            Poin
          </label>
          <input
            type="number" min={1} max={10}
            value={form.points}
            onChange={e => setForm(prev => ({ ...prev, points: Number(e.target.value) }))}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
          />
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab renders
  // ---------------------------------------------------------------------------

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Kode Akses', value: stats.total_access_codes, icon: faKey, color: 'amber' },
          { label: 'Sesi Aktif',    value: stats.active_access_codes, icon: faClock, color: 'emerald' },
          { label: 'Peserta',       value: stats.total_participants,  icon: faUsers, color: 'blue'  },
          { label: 'Soal',          value: stats.total_questions,     icon: faFileAlt, color: 'purple'},
        ].map(({ label, value, icon, color }) => {
          const colorMap = {
            amber: 'from-amber-400 to-amber-600 shadow-amber-500/25',
            emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/25',
            blue: 'from-blue-400 to-blue-600 shadow-blue-500/25',
            purple: 'from-purple-400 to-purple-600 shadow-purple-500/25'
          };
          return (
            <div key={label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{value ?? 0}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-lg`}>
                  <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 mr-2 text-amber-500" />
            Tingkat Penyelesaian
          </h4>
          <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            {(stats.completion_rate ?? 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-500 mt-1">peserta menyelesaikan ujian</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
            <FontAwesomeIcon icon={faAward} className="w-4 h-4 mr-2 text-amber-500" />
            Rata-rata Nilai
          </h4>
          <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            {(stats.average_score ?? 0).toFixed(1)}
          </p>
          <p className="text-sm text-slate-500 mt-1">dari semua ujian yang selesai</p>
        </div>
      </div>

      {Object.keys(stats.category_stats ?? {}).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 mr-2 text-amber-500" />
            Distribusi Kategori
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.category_stats).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/50">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAccessCodes = () => (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faKey} className="w-5 h-5 mr-2 text-amber-500" />
          Generate Kode Akses
        </h3>
        <form onSubmit={handleCreateAccessCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faKey} className="w-4 h-4 mr-2 text-amber-500" />
              Kode *
            </label>
            <input type="text" required
              value={accessCodeForm.code}
              onChange={e => setAccessCodeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="MATH-2025"
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400/60 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2 text-amber-500" />
              Deskripsi
            </label>
            <input type="text"
              value={accessCodeForm.description}
              onChange={e => setAccessCodeForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Babak Matematika"
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 placeholder-slate-400/60 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2 text-amber-500" />
              Kategori <span className="text-xs text-slate-400">(opsional)</span>
            </label>
            <select
              value={accessCodeForm.category}
              onChange={e => setAccessCodeForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            >
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-amber-500" />
              Mulai Sesi *
            </label>
            <input type="datetime-local" required
              value={accessCodeForm.session_start}
              onChange={e => setAccessCodeForm(p => ({ ...p, session_start: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-amber-500" />
              Akhir Sesi *
            </label>
            <input type="datetime-local" required
              value={accessCodeForm.session_end}
              onChange={e => setAccessCodeForm(p => ({ ...p, session_end: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faHourglassHalf} className="w-4 h-4 mr-2 text-amber-500" />
              Durasi (menit)
            </label>
            <input type="number" min={15} max={240}
              value={accessCodeForm.duration_minutes}
              onChange={e => setAccessCodeForm(p => ({ ...p, duration_minutes: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-amber-500" />
              Maks. Peserta
            </label>
            <input type="number" min={1} max={500}
              value={accessCodeForm.max_participants}
              onChange={e => setAccessCodeForm(p => ({ ...p, max_participants: e.target.value }))}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={isLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </span>
              ) : 'Generate Kode Akses'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faList} className="w-5 h-5 mr-2 text-amber-500" />
          Daftar Kode Akses
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 text-left text-sm font-semibold text-slate-500">
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Peserta</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accessCodes.map(code => (
                <tr key={code.id} className="border-b border-slate-200/30 hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-sm font-semibold text-slate-800">{code.code}</td>
                  <td className="py-3 px-4"><CategoryBadge category={code.category} /></td>
                  <td className="py-3 px-4 text-sm text-slate-500">{code.description || '–'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{code.current_participants}/{code.max_participants}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.status === 'active'    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      code.status === 'completed' ? 'bg-blue-100 text-blue-700 border border-blue-200'  :
                      code.status === 'archived'  ? 'bg-slate-100 text-slate-700 border border-slate-200'  :
                                                    'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {code.status ?? 'draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(code)}
                        className="text-amber-500 hover:text-amber-600 transition-colors" title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button onClick={() => handleDeleteAccessCode(code.id)}
                        className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accessCodes.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada kode akses</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {showEditAccessCodeModal && editingAccessCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full p-6 border border-slate-200/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-slate-800 flex items-center">
                <FontAwesomeIcon icon={faEdit} className="w-5 h-5 mr-2 text-amber-500" />
                Edit Kode Akses
              </h3>
              <button onClick={() => { setShowEditAccessCodeModal(false); setEditingAccessCode(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleUpdateAccessCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faKey} className="w-4 h-4 mr-2 text-amber-500" />
                  Kode
                </label>
                <input value={accessCodeForm.code} disabled 
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2 text-amber-500" />
                  Deskripsi
                </label>
                <input value={accessCodeForm.description}
                  onChange={e => setAccessCodeForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2 text-amber-500" />
                  Kategori
                </label>
                <select value={accessCodeForm.category}
                  onChange={e => setAccessCodeForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none">
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-amber-500" />
                  Mulai Sesi *
                </label>
                <input type="datetime-local" required value={accessCodeForm.session_start}
                  onChange={e => setAccessCodeForm(p => ({ ...p, session_start: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-amber-500" />
                  Akhir Sesi *
                </label>
                <input type="datetime-local" required value={accessCodeForm.session_end}
                  onChange={e => setAccessCodeForm(p => ({ ...p, session_end: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faHourglassHalf} className="w-4 h-4 mr-2 text-amber-500" />
                  Durasi (menit)
                </label>
                <input type="number" min={15} max={240} value={accessCodeForm.duration_minutes}
                  onChange={e => setAccessCodeForm(p => ({ ...p, duration_minutes: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-amber-500" />
                  Maks. Peserta
                </label>
                <input type="number" min={1} max={500} value={accessCodeForm.max_participants}
                  onChange={e => setAccessCodeForm(p => ({ ...p, max_participants: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 transition-all duration-300 disabled:opacity-50">
                  {isLoading ? (
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : 'Simpan Perubahan'}
                </button>
                <button type="button"
                  onClick={() => { setShowEditAccessCodeModal(false); setEditingAccessCode(null); }}
                  className="px-6 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all duration-300">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      {/* Access code selector */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faSearch} className="w-5 h-5 mr-2 text-amber-500" />
          Pilih Sesi Ujian
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select
            value={selectedAccessCodeId ?? ''}
            onChange={async e => {
              const id = Number(e.target.value) || null;
              setSelectedAccessCodeId(id);
              setQuestions([]);
              if (id) await fetchQuestions(id);
            }}
            className="w-full sm:flex-1 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
          >
            <option value="">Pilih kode akses...</option>
            {accessCodes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.description || 'Tanpa deskripsi'} ({c.current_participants} peserta)
                {c.category ? ` [${getCategoryLabel(c.category)}]` : ''}
              </option>
            ))}
          </select>
          <button onClick={() => setShowQuestionForm(v => !v)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 transition-all duration-300">
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
            {showQuestionForm ? 'Batal' : 'Tambah Soal'}
          </button>
        </div>

        {selectedAccessCodeId && accessCodeCategory && (
          <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/50 text-sm text-slate-700 flex items-center gap-2">
            <FontAwesomeIcon icon={faList} className="w-4 h-4 text-amber-500" />
            Kategori terkunci ke: <CategoryBadge category={accessCodeCategory} />
            <span className="text-xs text-slate-400 ml-1">(soal baru akan menggunakan kategori ini)</span>
          </div>
        )}
      </div>

      {/* Create question form */}
      {showQuestionForm && selectedAccessCodeId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faPlus} className="w-5 h-5 mr-2 text-amber-500" />
            Tambah Soal Baru
          </h3>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <QuestionFormFields
              form={questionForm}
              setForm={setQuestionForm}
              lockedCategory={accessCodeCategory}
            />
            <button type="submit" disabled={isLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 transition-all duration-300 disabled:opacity-50">
              {isLoading ? (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                  Membuat...
                </span>
              ) : 'Buat Soal'}
            </button>
          </form>
        </div>
      )}

      {/* Bulk import */}
      {selectedAccessCodeId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-amber-300/50 shadow-lg">
          <h3 className="font-display text-xl font-bold text-slate-800 mb-1 flex items-center">
            <FontAwesomeIcon icon={faUpload} className="w-5 h-5 mr-2 text-amber-500" />
            Import Soal Massal
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Upload file Excel (.xlsx) atau CSV.<br />
            Kolom wajib: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-600">question_text, option_a, option_b, correct_answer</code><br />
            Opsional: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-600">option_c, option_d, option_e, option_f, points, category</code><br />
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-600">correct_answer</code> menerima A/B/C/D/E/F (case-insensitive).
          </p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl font-medium text-amber-600 border-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300">
            <FontAwesomeIcon icon={faUpload} className="w-4 h-4 mr-2" />
            Pilih File
          </button>
        </div>
      )}

      {/* Question list */}
      {selectedAccessCodeId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faList} className="w-5 h-5 mr-2 text-amber-500" />
            Daftar Soal ({questions.length})
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-white rounded-xl border border-slate-200/50 hover:border-amber-200/50 transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-amber-600">Q{idx + 1}</span>
                      <CategoryBadge category={q.category} />
                      <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-slate-800 mb-2">{q.question_text}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`text-sm ${oi === q.correct_answer_index ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {oi === q.correct_answer_index && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditQuestionModal(q)} title="Edit" 
                      className="text-amber-500 hover:text-amber-600 transition-colors">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q.id)} title="Delete" 
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                Belum ada soal. Tambahkan di atas atau import dari Excel.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit question modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full p-6 border border-slate-200/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-slate-800 flex items-center">
                <FontAwesomeIcon icon={faEdit} className="w-5 h-5 mr-2 text-amber-500" />
                Edit Soal
              </h3>
              <button onClick={() => { setShowEditQuestionModal(false); setEditingQuestion(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              <QuestionFormFields
                form={questionForm}
                setForm={setQuestionForm}
                lockedCategory={accessCodeCategory}
              />
              <div className="flex gap-3">
                <button type="submit" disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 transition-all duration-300 disabled:opacity-50">
                  {isLoading ? (
                    <span className="flex items-center">
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : 'Simpan Perubahan'}
                </button>
                <button type="button"
                  onClick={() => { setShowEditQuestionModal(false); setEditingQuestion(null); }}
                  className="px-6 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all duration-300">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faSearch} className="w-5 h-5 mr-2 text-amber-500" />
          Pilih Sesi Ujian
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select
            value={selectedResultsCodeId ?? ''}
            onChange={async e => {
              const id = Number(e.target.value) || null;
              setSelectedResultsCodeId(id);
              setResults([]);
              if (id) await fetchResults(id);
            }}
            className="w-full sm:flex-1 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none"
          >
            <option value="">Pilih kode akses...</option>
            {accessCodes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.description || 'Tanpa deskripsi'} ({c.current_participants} peserta)
              </option>
            ))}
          </select>
          <button onClick={handleExportExcel} disabled={!selectedResultsCodeId || isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {selectedResultsCodeId && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faTrophy} className="w-5 h-5 mr-2 text-amber-500" />
            Papan Peringkat ({results.length})
          </h3>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
                <tr className="border-b border-slate-200/50 text-left text-sm font-semibold text-slate-500">
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Peserta</th>
                  <th className="py-3 px-4">Skor</th>
                  <th className="py-3 px-4">Benar</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">%</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-slate-200/30 hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        r.rank === 1 ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25' :
                        r.rank === 2 ? 'bg-slate-300 text-slate-700' :
                        r.rank === 3 ? 'bg-amber-600 text-white' :
                                       'bg-slate-100 text-slate-500'
                      }`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.student_name}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">{r.total_score}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{r.correct_answers}/{r.total_questions}</td>
                    <td className="py-3 px-4 text-sm font-mono text-slate-500">{(r.duration_seconds ?? 0).toFixed(1)}s</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-amber-100 rounded-full h-2">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                            style={{ width: `${Math.min(r.score_percentage, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{(r.score_percentage ?? 0).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada hasil</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2 text-red-500" />
          Kontrol Sistem
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <button onClick={handleFlushData} disabled={!selectedResultsCodeId || isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25">
              <FontAwesomeIcon icon={faDatabase} className="w-4 h-4 mr-2" />
              Hapus Data Peserta
            </button>
            <p className="text-xs text-slate-400 mt-2">Hapus semua jawaban dan data peserta (soal tetap)</p>
          </div>
          <div>
            <button onClick={handleResetExam} disabled={!selectedResultsCodeId || isLoading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-700/25">
              <FontAwesomeIcon icon={faRefresh} className="w-4 h-4 mr-2" />
              Reset Total Ujian
            </button>
            <p className="text-xs text-slate-400 mt-2">Hapus SEMUA: soal, jawaban, peserta, log</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
        <h3 className="font-display text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faList} className="w-5 h-5 mr-2 text-amber-500" />
          Log Sistem
        </h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={logType}
            onChange={async e => { setLogType(e.target.value); await fetchLogs(e.target.value); }}
            className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-200 transition-all duration-300 outline-none">
            <option value="">Semua Jenis</option>
            {['start', 'answer', 'submit', 'logout', 'warning', 'error'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={() => { setLogType(''); fetchLogs(''); }}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all duration-300">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            Hapus Filter
          </button>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
              <tr className="border-b border-slate-200/50 text-left text-sm font-semibold text-slate-500">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-200/30 hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.log_type === 'start'   ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      log.log_type === 'submit'  ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      log.log_type === 'warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      log.log_type === 'error'   ? 'bg-red-100 text-red-700 border border-red-200' :
                                                   'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {log.log_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{log.event_description}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {log.participant_id ? `User ${log.participant_id}` : 'Sistem'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Tidak ada log</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main return
  // ---------------------------------------------------------------------------

  const TABS = [
    { id: 'dashboard', label: 'Dashboard',          icon: faChartBar },
    { id: 'codes',     label: 'Kode Akses',         icon: faKey },
    { id: 'questions', label: 'Bank Soal',          icon: faFileAlt },
    { id: 'results',   label: 'Hasil',              icon: faTrophy },
    { id: 'logs',      label: 'Log Sistem',         icon: faList },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/30 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
              <FontAwesomeIcon icon={faKey} className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-slate-400">Sistem Manajemen Kompetisi</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('isAdmin'); navigate('/'); }}
            className="px-4 py-2 text-sm text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab nav */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200/50 pb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === t.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/25'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-amber-50/50'}`}
            >
              <FontAwesomeIcon icon={t.icon} className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center text-red-700">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center text-emerald-700">
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Tab content */}
        {!isLoading && (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'codes'     && renderAccessCodes()}
            {activeTab === 'questions' && renderQuestions()}
            {activeTab === 'results'   && renderResults()}
            {activeTab === 'logs'      && renderLogs()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;