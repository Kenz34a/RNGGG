import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
export const searchText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
export function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="search-field"><Search size={17} /><input aria-label={label} placeholder={`${label}…`} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
export function usePages<T>(items: T[], size = 24, filterKey = '') {
  const [cursor, setCursor] = useState({ page: 0, filterKey });
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const page = cursor.filterKey === filterKey ? Math.min(cursor.page, pageCount - 1) : 0;
  return { page, pageCount, visible: items.slice(page * size, (page + 1) * size), change: (next: number) => setCursor({ page: Math.max(0, Math.min(pageCount - 1, Number.isFinite(next) ? Math.trunc(next) : 0)), filterKey }) };
}
export function Pagination({ page, pageCount, change, total, size }: { page: number; pageCount: number; change: (page: number) => void; total: number; size: number }) {
  if (!total) return null;
  return <div className="pagination"><span>{page * size + 1}–{Math.min(total, (page + 1) * size)} / {total.toLocaleString('vi-VN')} mục</span><div><button className="icon-button" aria-label="Trang trước" disabled={page === 0} onClick={() => change(page - 1)}><ChevronLeft size={17} /></button><label>Trang <input aria-label="Số trang" type="number" min="1" max={pageCount} value={page + 1} onChange={e => { if (e.target.value) change(Number(e.target.value) - 1); }} /> / {pageCount}</label><button className="icon-button" aria-label="Trang sau" disabled={page + 1 >= pageCount} onClick={() => change(page + 1)}><ChevronRight size={17} /></button></div></div>;
}
