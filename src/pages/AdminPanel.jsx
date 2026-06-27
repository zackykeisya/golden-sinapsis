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
        // FIX: send lowercase category or null — backend enum is lowercase
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
    if (!category) return <span className="text-xs text-gray-400 italic">Tidak dibatasi</span>;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${getCategoryBadge(category)}`}>
        {getCategoryIcon(category)} {getCategoryLabel(category)}
      </span>
    );
  };

  const QuestionFormFields = ({ form, setForm, lockedCategory }) => (
    <>
      <div>
        <label className="block text-sm font-medium text-charcoal-light mb-1.5">Question Text</label>
        <textarea
          value={form.question_text}
          onChange={e => setForm(prev => ({ ...prev, question_text: e.target.value }))}
          rows={3} required
          className="w-full px-3 py-2 input-gold rounded-lg"
          placeholder="Enter the question…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-light mb-1.5">Category</label>
        <select
          value={form.category}
          onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
          disabled={!!lockedCategory}
          className="w-full px-3 py-2 input-gold rounded-lg disabled:bg-gray-50"
        >
          {CATEGORY_OPTIONS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {lockedCategory && (
          <p className="text-xs text-gold-dark mt-1 flex items-center gap-1">
            🔒 Locked to access code category: <strong>{getCategoryLabel(lockedCategory)}</strong>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-light mb-1.5">Answer Options</label>
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
            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            required
            className="w-full px-3 py-2 input-gold rounded-lg mb-2"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-light mb-1.5">Correct Answer</label>
          <select
            value={form.correct_answer_index}
            onChange={e => setForm(prev => ({ ...prev, correct_answer_index: Number(e.target.value) }))}
            className="w-full px-3 py-2 input-gold rounded-lg"
          >
            {form.options.map((_, idx) => (
              <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-light mb-1.5">Points</label>
          <input
            type="number" min={1} max={10}
            value={form.points}
            onChange={e => setForm(prev => ({ ...prev, points: Number(e.target.value) }))}
            className="w-full px-3 py-2 input-gold rounded-lg"
          />
        </div>
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Tab renders
  // ---------------------------------------------------------------------------

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Access Codes', value: stats.total_access_codes, icon: '🔑', color: 'amber' },
          { label: 'Active Sessions',    value: stats.active_access_codes, icon: '⚡', color: 'green' },
          { label: 'Participants',       value: stats.total_participants,  icon: '👥', color: 'blue'  },
          { label: 'Questions',          value: stats.total_questions,     icon: '📝', color: 'purple'},
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gold-light/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{value ?? 0}</h3>
              </div>
              <span className="text-3xl">{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gold-light/30">
          <h4 className="font-semibold text-gray-800 mb-2">Completion Rate</h4>
          <p className="text-3xl font-bold text-amber-500">{(stats.completion_rate ?? 0).toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">of participants completed their exam</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gold-light/30">
          <h4 className="font-semibold text-gray-800 mb-2">Average Score</h4>
          <p className="text-3xl font-bold text-amber-500">{(stats.average_score ?? 0).toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">across all completed exams</p>
        </div>
      </div>

      {Object.keys(stats.category_stats ?? {}).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gold-light/30">
          <h4 className="font-semibold text-gray-800 mb-4">📊 Category Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.category_stats).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-sm font-bold">{count}</span>
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
      <div className="card-gold p-6">
        <h3 className="font-display text-xl text-charcoal mb-4">Generate Access Code</h3>
        <form onSubmit={handleCreateAccessCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Code *</label>
            <input type="text" required
              value={accessCodeForm.code}
              onChange={e => setAccessCodeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="MATH-2025"
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Description</label>
            <input type="text"
              value={accessCodeForm.description}
              onChange={e => setAccessCodeForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mathematics Round 1"
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">
              Category <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <select
              value={accessCodeForm.category}
              onChange={e => setAccessCodeForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 input-gold rounded-lg"
            >
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Session Start *</label>
            <input type="datetime-local" required
              value={accessCodeForm.session_start}
              onChange={e => setAccessCodeForm(p => ({ ...p, session_start: e.target.value }))}
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Session End *</label>
            <input type="datetime-local" required
              value={accessCodeForm.session_end}
              onChange={e => setAccessCodeForm(p => ({ ...p, session_end: e.target.value }))}
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Duration (min)</label>
            <input type="number" min={15} max={240}
              value={accessCodeForm.duration_minutes}
              onChange={e => setAccessCodeForm(p => ({ ...p, duration_minutes: e.target.value }))}
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-light mb-1.5">Max Participants</label>
            <input type="number" min={1} max={500}
              value={accessCodeForm.max_participants}
              onChange={e => setAccessCodeForm(p => ({ ...p, max_participants: e.target.value }))}
              className="w-full px-3 py-2 input-gold rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={isLoading}
              className="btn-gold px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50">
              {isLoading ? 'Creating…' : 'Generate Access Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card-gold p-6">
        <h3 className="font-display text-xl text-charcoal mb-4">Access Codes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-light/30 text-left text-sm font-semibold text-charcoal-gray">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Participants</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessCodes.map(code => (
                <tr key={code.id} className="border-b border-gold-light/20 hover:bg-gold-glow/10">
                  <td className="py-3 px-4 font-mono text-sm font-semibold">{code.code}</td>
                  <td className="py-3 px-4"><CategoryBadge category={code.category} /></td>
                  <td className="py-3 px-4 text-sm text-charcoal-gray">{code.description || '–'}</td>
                  <td className="py-3 px-4 text-sm">{code.current_participants}/{code.max_participants}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.status === 'active'    ? 'bg-green-100 text-green-700' :
                      code.status === 'completed' ? 'bg-blue-100 text-blue-700'  :
                      code.status === 'archived'  ? 'bg-gray-100 text-gray-700'  :
                                                    'bg-yellow-100 text-yellow-700'
                    }`}>
                      {code.status ?? 'draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(code)}
                        className="text-gold hover:text-gold-dark transition-colors" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteAccessCode(code.id)}
                        className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accessCodes.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-charcoal-gray/50">No access codes yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {showEditAccessCodeModal && editingAccessCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-charcoal">Edit Access Code</h3>
              <button onClick={() => { setShowEditAccessCodeModal(false); setEditingAccessCode(null); }}
                className="text-charcoal-gray/50 hover:text-charcoal">✕</button>
            </div>
            <form onSubmit={handleUpdateAccessCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Code</label>
                <input value={accessCodeForm.code} disabled className="w-full px-3 py-2 input-gold rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input value={accessCodeForm.description}
                  onChange={e => setAccessCodeForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={accessCodeForm.category}
                  onChange={e => setAccessCodeForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg">
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Session Start *</label>
                <input type="datetime-local" required value={accessCodeForm.session_start}
                  onChange={e => setAccessCodeForm(p => ({ ...p, session_start: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Session End *</label>
                <input type="datetime-local" required value={accessCodeForm.session_end}
                  onChange={e => setAccessCodeForm(p => ({ ...p, session_end: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
                <input type="number" min={15} max={240} value={accessCodeForm.duration_minutes}
                  onChange={e => setAccessCodeForm(p => ({ ...p, duration_minutes: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Participants</label>
                <input type="number" min={1} max={500} value={accessCodeForm.max_participants}
                  onChange={e => setAccessCodeForm(p => ({ ...p, max_participants: e.target.value }))}
                  className="w-full px-3 py-2 input-gold rounded-lg" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={isLoading}
                  className="btn-gold px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50">
                  {isLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button"
                  onClick={() => { setShowEditAccessCodeModal(false); setEditingAccessCode(null); }}
                  className="px-6 py-2.5 border border-charcoal-gray/20 rounded-lg font-medium text-charcoal-gray hover:bg-gray-50">
                  Cancel
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
      <div className="card-gold p-6">
        <h3 className="font-display text-xl text-charcoal mb-4">Select Exam Session</h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedAccessCodeId ?? ''}
            onChange={async e => {
              const id = Number(e.target.value) || null;
              setSelectedAccessCodeId(id);
              setQuestions([]);
              if (id) await fetchQuestions(id);
            }}
            className="flex-1 px-3 py-2 input-gold rounded-lg"
          >
            <option value="">Select an access code…</option>
            {accessCodes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.description || 'No description'} ({c.current_participants} participants)
                {c.category ? ` [${getCategoryLabel(c.category)}]` : ''}
              </option>
            ))}
          </select>
          <button onClick={() => setShowQuestionForm(v => !v)}
            className="btn-gold px-4 py-2 rounded-lg font-medium text-white text-sm">
            {showQuestionForm ? 'Cancel' : '+ Add Question'}
          </button>
        </div>

        {selectedAccessCodeId && accessCodeCategory && (
          <div className="mt-3 p-3 bg-gold-glow/20 rounded-lg border border-gold-light/30 text-sm text-charcoal flex items-center gap-2">
            📌 Category locked to: <CategoryBadge category={accessCodeCategory} />
            <span className="text-xs text-charcoal-gray/50 ml-1">(new questions will use this category)</span>
          </div>
        )}
      </div>

      {/* Create question form */}
      {showQuestionForm && selectedAccessCodeId && (
        <div className="card-gold p-6">
          <h3 className="font-display text-xl text-charcoal mb-4">Add New Question</h3>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <QuestionFormFields
              form={questionForm}
              setForm={setQuestionForm}
              lockedCategory={accessCodeCategory}
            />
            <button type="submit" disabled={isLoading}
              className="btn-gold px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50">
              {isLoading ? 'Creating…' : 'Create Question'}
            </button>
          </form>
        </div>
      )}

      {/* Bulk import */}
      {selectedAccessCodeId && (
        <div className="card-gold p-6 border-2 border-dashed border-gold-light/50">
          <h3 className="font-display text-xl text-charcoal mb-1">Bulk Import Questions</h3>
          <p className="text-sm text-charcoal-gray/60 mb-4">
            Upload an Excel (.xlsx) or CSV file.<br />
            Required columns: <code>question_text, option_a, option_b, correct_answer</code><br />
            Optional: <code>option_c, option_d, option_e, option_f, points, category</code><br />
            <code>correct_answer</code> accepts A/B/C/D/E/F (case-insensitive).
          </p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="btn-gold-outline px-6 py-2.5 rounded-lg font-medium">
            Choose File
          </button>
        </div>
      )}

      {/* Question list */}
      {selectedAccessCodeId && (
        <div className="card-gold p-6">
          <h3 className="font-display text-xl text-charcoal mb-4">Questions ({questions.length})</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-white-luxury rounded-lg border border-gold-light/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-gold">Q{idx + 1}</span>
                      <CategoryBadge category={q.category} />
                      <span className="text-xs text-charcoal-gray/50">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-charcoal mb-2">{q.question_text}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`text-sm ${oi === q.correct_answer_index ? 'text-green-600 font-semibold' : 'text-charcoal-gray'}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {oi === q.correct_answer_index && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditQuestionModal(q)} title="Edit" className="text-gold hover:text-gold-dark">✏️</button>
                    <button onClick={() => handleDeleteQuestion(q.id)} title="Delete" className="text-red-400 hover:text-red-600">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center text-charcoal-gray/50 py-8">No questions yet. Add one above or import from Excel.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit question modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-charcoal">Edit Question</h3>
              <button onClick={() => { setShowEditQuestionModal(false); setEditingQuestion(null); }}
                className="text-charcoal-gray/50 hover:text-charcoal">✕</button>
            </div>
            <form onSubmit={handleUpdateQuestion} className="space-y-4">
              <QuestionFormFields
                form={questionForm}
                setForm={setQuestionForm}
                lockedCategory={accessCodeCategory}
              />
              <div className="flex gap-3">
                <button type="submit" disabled={isLoading}
                  className="btn-gold px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50">
                  {isLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button"
                  onClick={() => { setShowEditQuestionModal(false); setEditingQuestion(null); }}
                  className="px-6 py-2.5 border border-charcoal-gray/20 rounded-lg font-medium text-charcoal-gray hover:bg-gray-50">
                  Cancel
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
      <div className="card-gold p-6">
        <h3 className="font-display text-xl text-charcoal mb-4">Select Exam Session</h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedResultsCodeId ?? ''}
            onChange={async e => {
              const id = Number(e.target.value) || null;
              setSelectedResultsCodeId(id);
              setResults([]);
              if (id) await fetchResults(id);
            }}
            className="flex-1 px-3 py-2 input-gold rounded-lg"
          >
            <option value="">Select an access code…</option>
            {accessCodes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.description || 'No description'} ({c.current_participants} participants)
              </option>
            ))}
          </select>
          <button onClick={handleExportExcel} disabled={!selectedResultsCodeId || isLoading}
            className="btn-gold px-4 py-2 rounded-lg font-medium text-white text-sm disabled:opacity-50">
            Export Excel
          </button>
        </div>
      </div>

      {selectedResultsCodeId && (
        <div className="card-gold p-6">
          <h3 className="font-display text-xl text-charcoal mb-4">Leaderboard ({results.length})</h3>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gold-light/30 text-left text-sm font-semibold text-charcoal-gray">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Correct</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">%</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gold-light/20 hover:bg-gold-glow/10">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        r.rank === 1 ? 'bg-gold-gradient text-white shadow-gold' :
                        r.rank === 2 ? 'bg-gray-300 text-gray-700' :
                        r.rank === 3 ? 'bg-amber-600 text-white' :
                                       'bg-gold-light/30 text-charcoal-gray'
                      }`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{r.student_name}</td>
                    <td className="py-3 px-4 font-bold text-gold">{r.total_score}</td>
                    {/* FIX: correct_answers now comes from backend query */}
                    <td className="py-3 px-4 text-sm">{r.correct_answers}/{r.total_questions}</td>
                    <td className="py-3 px-4 text-sm font-mono">{(r.duration_seconds ?? 0).toFixed(1)}s</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gold-light rounded-full h-2">
                          <div className="h-full bg-gold-gradient rounded-full"
                            style={{ width: `${Math.min(r.score_percentage, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{(r.score_percentage ?? 0).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-charcoal-gray/50">No results yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card-gold p-6 border-2 border-red-200">
        <h3 className="font-display text-xl text-charcoal mb-4 flex items-center gap-2">
          ⚠️ System Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <button onClick={handleFlushData} disabled={!selectedResultsCodeId || isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50">
              🗑️ Flush Student Data
            </button>
            <p className="text-xs text-charcoal-gray/50 mt-2">Remove all student answers and participant data (questions kept)</p>
          </div>
          <div>
            <button onClick={handleResetExam} disabled={!selectedResultsCodeId || isLoading}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50">
              ⚠️ Reset Exam Completely
            </button>
            <p className="text-xs text-charcoal-gray/50 mt-2">Remove EVERYTHING: questions, answers, participants, logs</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="card-gold p-6">
        <h3 className="font-display text-xl text-charcoal mb-4">System Logs</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={logType}
            onChange={async e => { setLogType(e.target.value); await fetchLogs(e.target.value); }}
            className="px-3 py-2 input-gold rounded-lg">
            <option value="">All Types</option>
            {['start', 'answer', 'submit', 'logout', 'warning', 'error'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={() => { setLogType(''); fetchLogs(''); }}
            className="px-4 py-2 border border-charcoal-gray/20 rounded-lg text-sm hover:bg-gray-50">
            Clear Filter
          </button>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gold-light/30 text-left text-sm font-semibold text-charcoal-gray">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gold-light/20 hover:bg-gold-glow/10">
                  <td className="py-3 px-4 text-sm font-mono text-charcoal-gray/60">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.log_type === 'start'   ? 'bg-green-100 text-green-700'  :
                      log.log_type === 'submit'  ? 'bg-blue-100 text-blue-700'    :
                      log.log_type === 'warning' ? 'bg-yellow-100 text-yellow-700':
                      log.log_type === 'error'   ? 'bg-red-100 text-red-700'      :
                                                   'bg-gray-100 text-gray-700'
                    }`}>
                      {log.log_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{log.event_description}</td>
                  <td className="py-3 px-4 text-sm text-charcoal-gray/60">
                    {log.participant_id ? `User ${log.participant_id}` : 'System'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-charcoal-gray/50">No logs found</td></tr>
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
    { id: 'dashboard', label: 'Dashboard',          icon: '📊' },
    { id: 'codes',     label: 'Access Codes',       icon: '🔑' },
    { id: 'questions', label: 'Question Bank',      icon: '📝' },
    { id: 'results',   label: 'Results',            icon: '🏆' },
    { id: 'logs',      label: 'System Logs',        icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-white-luxury">
      <header className="bg-white border-b border-gold-light/30 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-white shadow-gold text-lg">
              ⚙️
            </div>
            <div>
              <h1 className="text-xl font-display text-charcoal">Admin Panel</h1>
              <p className="text-xs text-charcoal-gray/60">Competition Management System</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('isAdmin'); navigate('/'); }}
            className="px-4 py-2 text-sm text-charcoal-gray/60 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab nav */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gold-light/30 pb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === t.id
                  ? 'bg-gold-gradient text-white shadow-gold'
                  : 'text-charcoal-gray hover:text-charcoal hover:bg-gold-glow'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <span className="mr-2">⚠️</span> {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
            <span className="mr-2">✅</span> {success}
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">✕</button>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="spinner-gold"></div>
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