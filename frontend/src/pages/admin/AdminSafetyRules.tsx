// [2026-04-18] 관리자 안전수칙 관리 (업종별 CRUD)
// [2026-04-21] 디자인 표준화
import React, { useEffect, useState } from 'react';
import {
  getSafetyRulesApi, getIndustriesApi,
  createSafetyRuleApi, updateSafetyRuleApi, deleteSafetyRuleApi,
} from '../../api/safetyRules';

interface SafetyRule {
  id: string;
  industry: string;
  title: string;
  content: string;
  order: number;
}

const emptyForm = { industry: '', title: '', content: '', order: '0' };

export default function AdminSafetyRules() {
  const [rules, setRules] = useState<SafetyRule[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [filterIndustry, setFilterIndustry] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [filterIndustry]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rulesRes, indRes] = await Promise.all([
        getSafetyRulesApi(filterIndustry || undefined),
        getIndustriesApi(),
      ]);
      setRules(rulesRes.data.data);
      setIndustries(indRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.industry || !form.title || !form.content) {
      setError('업종, 제목, 내용은 필수입니다.');
      return;
    }
    try {
      if (editId) {
        await updateSafetyRuleApi(editId, {
          industry: form.industry,
          title: form.title,
          content: form.content,
          order: Number(form.order),
        });
      } else {
        await createSafetyRuleApi({
          industry: form.industry,
          title: form.title,
          content: form.content,
          order: Number(form.order),
        });
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditId(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || '저장 실패');
    }
  };

  const startEdit = (rule: SafetyRule) => {
    setForm({ industry: rule.industry, title: rule.title, content: rule.content, order: String(rule.order) });
    setEditId(rule.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await deleteSafetyRuleApi(id);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제 실패');
    }
  };

  const grouped = rules.reduce<Record<string, SafetyRule[]>>((acc, rule) => {
    if (!acc[rule.industry]) acc[rule.industry] = [];
    acc[rule.industry].push(rule);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">안전수칙 관리</h1>

      {/* 등록 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(''); }}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 새 안전수칙
        </button>
      </div>

      {/* 등록/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editId ? '안전수칙 수정' : '안전수칙 등록'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setError(''); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">업종 *</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 조선업, 건설업..."
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    list="industry-list"
                  />
                  <datalist id="industry-list">
                    {industries.map((ind) => <option key={ind} value={ind} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="안전수칙 제목"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="안전수칙 내용을 입력하세요."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">순서</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditId(null); setError(''); }}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                >
                  {editId ? '수정 저장' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 업종 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterIndustry('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterIndustry === ''
              ? 'bg-blue-700 text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setFilterIndustry(ind)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterIndustry === ind
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
          불러오는 중...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
          등록된 안전수칙이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([industry, items]) => (
            <div key={industry} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{industry}</span>
                <span className="text-xs text-gray-400">{items.length}건</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {items.map((rule) => (
                    <React.Fragment key={rule.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                      >
                        <td className="px-4 py-3 w-10 text-xs text-gray-400 text-center">{rule.order}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{rule.title}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(rule); }}
                              className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 px-2 py-1 rounded hover:border-blue-300 transition-colors"
                            >수정</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                              className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded hover:border-red-300 transition-colors"
                            >삭제</button>
                            <span className="text-gray-300 text-xs w-4">{expandedId === rule.id ? '▲' : '▼'}</span>
                          </div>
                        </td>
                      </tr>
                      {expandedId === rule.id && (
                        <tr>
                          <td colSpan={3} className="px-10 py-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100">
                            {rule.content}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
