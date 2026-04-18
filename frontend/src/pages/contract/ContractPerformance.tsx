// [2026-04-18] 계약부서 안전보건실적 입력 페이지
import React, { useEffect, useState } from 'react';
import {
  getCategoriesApi, getPerformancesApi,
  createPerformanceApi, updatePerformanceApi, deletePerformanceApi,
} from '../../api/performance';

interface Performance {
  id: string;
  year: number;
  month: number;
  department: string;
  category: string;
  value: number;
  note: string | null;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const emptyForm = { department: '', category: '', value: '', note: '' };

export default function ContractPerformance() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [categories, setCategories] = useState<string[]>([]);
  const [list, setList] = useState<Performance[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategoriesApi().then((r) => setCategories(r.data.data));
  }, []);

  useEffect(() => {
    fetchList();
  }, [year, month]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const r = await getPerformancesApi({ year, month });
      setList(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.department || !form.category || form.value === '') {
      setError('부서, 카테고리, 실적값은 필수입니다.');
      return;
    }
    try {
      await createPerformanceApi({
        year, month,
        department: form.department,
        category: form.category,
        value: Number(form.value),
        note: form.note || undefined,
      });
      setForm(emptyForm);
      fetchList();
    } catch (err: any) {
      setError(err.response?.data?.message || '등록 실패');
    }
  };

  const startEdit = (p: Performance) => {
    setEditId(p.id);
    setEditForm({ department: p.department, category: p.category, value: String(p.value), note: p.note || '' });
  };

  const handleUpdate = async (id: string) => {
    setError('');
    try {
      await updatePerformanceApi(id, {
        department: editForm.department,
        category: editForm.category,
        value: Number(editForm.value),
        note: editForm.note || null,
      });
      setEditId(null);
      fetchList();
    } catch (err: any) {
      setError(err.response?.data?.message || '수정 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await deletePerformanceApi(id);
      fetchList();
    } catch (err: any) {
      setError(err.response?.data?.message || '삭제 실패');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">안전보건실적 입력</h1>

      {/* 기간 선택 */}
      <div className="flex gap-3 mb-6">
        <select
          className="border rounded px-3 py-2"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select
          className="border rounded px-3 py-2"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleCreate} className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-700 mb-3">신규 실적 입력</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="부서명 *"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">카테고리 선택 *</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            className="border rounded px-3 py-2 text-sm"
            placeholder="실적값 *"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="비고"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + 등록
        </button>
      </form>

      {/* 목록 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <span className="font-semibold text-gray-700">{year}년 {month}월 실적 목록</span>
          <span className="ml-2 text-sm text-gray-500">({list.length}건)</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-400">등록된 실적이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">부서</th>
                <th className="px-4 py-2 text-left text-gray-600">카테고리</th>
                <th className="px-4 py-2 text-right text-gray-600">실적값</th>
                <th className="px-4 py-2 text-left text-gray-600">비고</th>
                <th className="px-4 py-2 text-center text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  {editId === p.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          className="border rounded px-2 py-1 w-full text-sm"
                          value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="border rounded px-2 py-1 w-full text-sm"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full text-sm text-right"
                          value={editForm.value}
                          onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="border rounded px-2 py-1 w-full text-sm"
                          value={editForm.note}
                          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2 text-center space-x-2">
                        <button
                          onClick={() => handleUpdate(p.id)}
                          className="text-blue-600 hover:underline text-xs"
                        >저장</button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-gray-500 hover:underline text-xs"
                        >취소</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-gray-800">{p.department}</td>
                      <td className="px-4 py-2 text-gray-700">{p.category}</td>
                      <td className="px-4 py-2 text-right font-mono">{p.value.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-500">{p.note || '-'}</td>
                      <td className="px-4 py-2 text-center space-x-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-blue-600 hover:underline text-xs"
                        >수정</button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:underline text-xs"
                        >삭제</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
