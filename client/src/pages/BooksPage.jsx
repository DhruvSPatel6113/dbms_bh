import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, DownloadCloud } from 'lucide-react';
import { booksApi } from '../api/endpoints';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function BooksPage() {
  const queryClient = useQueryClient();
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [isbnLookup, setIsbnLookup] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    totalCopies: 5,
    publication: '',
    dateOfPublish: '2022-01-01',
    cost: 50.00
  });

  const { data: booksData, isLoading } = useQuery({
    queryKey: ['books', search, page],
    queryFn: () => booksApi.list({ q: search || undefined, page, limit: 20 })
  });
  const refreshBooks = () => queryClient.invalidateQueries({ queryKey: ['books'] });

  const createMutation = useMutation({
    mutationFn: (data) => booksApi.create(data),
    onSuccess: () => {
      refreshBooks();
      setIsModalOpen(false);
      setEditingBook(null);
      setToast('Book registered successfully!');
      setTimeout(() => setToast(''), 3000);
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => booksApi.update(id, data),
    onSuccess: () => {
      refreshBooks();
      setIsModalOpen(false);
      setEditingBook(null);
      setToast('Book details updated.');
      setTimeout(() => setToast(''), 3000);
    },
    onError: (err) => alert(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => booksApi.delete(id),
    onSuccess: () => {
      refreshBooks();
      setToast('Book deleted successfully');
      setTimeout(() => setToast(''), 3000);
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const handleLookup = async () => {
    if (!isbnLookup) return;
    setLookupLoading(true);
    try {
      const res = await booksApi.lookupISBN(isbnLookup);
      const b = res.data;
      setFormData(prev => ({
        ...prev,
        title: b.title || prev.title,
        author: b.author || prev.author,
        isbn: b.isbn || isbnLookup,
        publication: b.publication || prev.publication,
        dateOfPublish: b.dateOfPublish || prev.dateOfPublish,
        category: b.category || prev.category
      }));
    } catch (err) {
      alert('ISBN lookup failed: ' + err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const books = booksData?.data?.items || [];
  const pagination = booksData?.data?.pagination;
  const startCreate = () => {
    setEditingBook(null);
    setFormData({ title: '', author: '', isbn: '', category: 'Computer Science', totalCopies: 5, publication: '', dateOfPublish: '2022-01-01', cost: 50 });
    setIsbnLookup('');
    setIsModalOpen(true);
  };
  const startEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title, author: book.author, isbn: book.isbn, category: book.category,
      totalCopies: book.totalCopies, publication: book.publication,
      dateOfPublish: new Date(book.dateOfPublish).toISOString().slice(0, 10), cost: Number(book.cost)
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Books Inventory</h2>
          <p className="text-sm text-slate-500">Manage titles, stock levels, and ISBN cataloging</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Book
        </button>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Title & Author</th>
              <th className="p-4">ISBN</th>
              <th className="p-4">Category</th>
              <th className="p-4">Availability</th>
              <th className="p-4">Cost</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading catalog...</td></tr>
            ) : books.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No books found matching search criteria.</td></tr>
            ) : (
              books.map((b) => (
                <tr key={b.bookId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.author} - {b.publication}</p>
                  </td>
                  <td className="p-4 font-mono text-xs">{b.isbn}</td>
                  <td className="p-4"><Badge variant="default">{b.category}</Badge></td>
                  <td className="p-4">
                    <Badge variant={b.avlCopies > 0 ? 'success' : 'danger'}>
                      {b.avlCopies} / {b.totalCopies} Available
                    </Badge>
                  </td>
                  <td className="p-4 font-medium">Rs. {Number(b.cost).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(b)} className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {isAdmin && <button
                      onClick={() => {
                        if (confirm(`Delete book "${b.title}"?`)) deleteMutation.mutate(b.bookId);
                      }}
                      aria-label={`Delete ${b.title}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} books</span>
            <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button></div>
          </div>
        )}
      </div>

      {/* Add Book Modal with ISBN Lookup */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBook(null); }} title={editingBook ? 'Edit book details' : 'Register New Book'}>
        <div className="space-y-4">
          {!editingBook && <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <label className="block text-xs font-semibold text-indigo-900 mb-1">Auto-Fill via Google Books API</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 10 or 13-digit ISBN..."
                value={isbnLookup}
                onChange={(e) => setIsbnLookup(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-md"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                {lookupLoading ? 'Fetching...' : 'Lookup'}
              </button>
            </div>
          </div>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingBook) {
                updateMutation.mutate({ id: editingBook.bookId, data: {
                  title: formData.title, author: formData.author, category: formData.category,
                  totalCopies: Number(formData.totalCopies), publication: formData.publication,
                  dateOfPublish: formData.dateOfPublish, cost: Number(formData.cost)
                } });
              } else {
                createMutation.mutate(formData);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Author</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">ISBN {editingBook && <span className="font-normal text-slate-500">(cannot be changed after registration)</span>}</label>
                <input
                  type="text"
                  required={!editingBook}
                  readOnly={Boolean(editingBook)}
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Total Copies <span className="font-normal text-slate-500">(on loan: {editingBook ? editingBook.totalCopies - editingBook.avlCopies : 0})</span></label>
                <input
                  type="number"
                  min={editingBook ? '0' : '1'}
                  max="2147483647"
                  step="1"
                  required
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Cost (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999999.99"
                  required
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Published</label>
                <input
                  type="date"
                  required
                  value={formData.dateOfPublish}
                  onChange={(e) => setFormData({ ...formData, dateOfPublish: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Publisher</label>
              <input
                type="text"
                required
                value={formData.publication}
                onChange={(e) => setFormData({ ...formData, publication: e.target.value })}
                className="w-full px-3 py-1.5 border rounded-md text-sm"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingBook(null); }}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingBook ? 'Save changes' : 'Save Book'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
