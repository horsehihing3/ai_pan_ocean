// [2026-04-18] 관리자 안전수칙 관리 (업종별 CRUD)
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

  // 업종별 그룹핑
  const grouped = rules.reduce<Record<string, SafetyRule[]>>((acc, rule) => {
    if (!acc[rule.industry]) acc[rule.industry] = [];
    acc[rule.industry].push(rule);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">안전수칙 관리</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(''); }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + 새 안전수칙
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            {editId ? '안전수칙 수정' : '안전수칙 등록'}
          </h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">업종 *</label>
              <input
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="예: 조선업, 건설업, 화학업..."
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                list="industry-list"
              />
              <datalist id="industry-list">
                {industries.map((ind) => <option key={ind} value={ind} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">제목 *</label>
              <input
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="안전수칙 제목"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">내용 *</label>
            <textarea
              className="border rounded px-3 py-2 text-sm w-full"
              rows={4}
              placeholder="안전수칙 내용을 입력하세요."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">순서</label>
              <input
                type="number"
                className="border rounded px-3 py-2 text-sm w-full"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
            <div className="flex gap-2 ml-auto mt-4">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                {editId ? '수정 저장' : '등록'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); setError(''); }}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 업종 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterIndustry('')}
          className={`px-3 py-1.5 rounded text-sm border transition-colors ${
            filterIndustry === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setFilterIndustry(ind)}
            className={`px-3 py-1.5 rounded text-sm border transition-colors ${
              filterIndustry === ind ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">등록된 안전수칙이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([industry, items]) => (
            <div key={industry} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <span className="font-semibold text-gray-700">{industry}</span>
                <span className="text-xs text-gray-400">{items.length}건</span>
              </div>
              <ul className="divide-y">
                {items.map((rule) => (
                  <li key={rule.id}>
                    <div
                      className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5 text-center">{rule.order}</span>
                        <span className="text-sm font-medium text-gray-800">{rule.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(rule); }}
                          className="text-blue-600 hover:underline text-xs"
                        >수정</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                          className="text-red-500 hover:underline text-xs"
                        >삭제</button>
                        <span className="text-gray-300 text-xs">{expandedId === rule.id ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {expandedId === rule.id && (
                      <div className="px-10 py-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap border-t">
                        {rule.content}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
