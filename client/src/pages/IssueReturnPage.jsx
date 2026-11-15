import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, AlertCircle, Search } from 'lucide-react';
import { booksApi, membersApi, txnsApi } from '../api/endpoints';
import Badge from '../components/Badge';

function SearchResults({ label, value, onChange, children, placeholder }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <span className="relative mt-1 block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border px-3 py-2 pl-9 text-sm font-normal" autoComplete="off" />
      </span>
      {children}
    </label>
  );
}

export default function IssueReturnPage() {
  const queryClient = useQueryClient();
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [loanSearch, setLoanSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { data: booksData } = useQuery({
    queryKey: ['circulationBookSearch', bookSearch],
    queryFn: () => booksApi.list({ q: bookSearch, limit: 10 }),
    enabled: bookSearch.trim().length >= 2
  });
  const { data: membersData } = useQuery({
    queryKey: ['circulationMemberSearch', memberSearch],
    queryFn: () => membersApi.list({ q: memberSearch, limit: 10 }),
    enabled: memberSearch.trim().length >= 2
  });
  const { data: loanSearchData } = useQuery({
    queryKey: ['activeTxns', loanSearch],
    queryFn: () => txnsApi.listActive({ q: loanSearch, limit: 20 }),
    enabled: loanSearch.trim().length >= 2
  });
  const { data: overdueData } = useQuery({
    queryKey: ['overdueTxns'],
    queryFn: () => txnsApi.listOverdue()
  });

  const refreshCirculation = () => {
    queryClient.invalidateQueries({ queryKey: ['overdueTxns'] });
    queryClient.invalidateQueries({ queryKey: ['activeTxns'] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['fines'] });
  };
  const issueMutation = useMutation({
    mutationFn: () => txnsApi.issue({ bookId: selectedBook.bookId, memberId: selectedMember.memberId, ...(issueDate && { issueDate }) }),
    onSuccess: (res) => {
      refreshCirculation();
      setFeedback({ type: 'success', text: `Loan created for ${selectedBook.title}. Due ${new Date(res.data.dueDate).toLocaleDateString()}.` });
      setSelectedBook(null); setSelectedMember(null); setBookSearch(''); setMemberSearch(''); setIssueDate('');
    },
    onError: (error) => setFeedback({ type: 'error', text: error.message })
  });
  const returnMutation = useMutation({
    mutationFn: ({ txnId, date }) => txnsApi.returnBook(txnId, date || undefined),
    onSuccess: (res) => {
      refreshCirculation();
      const fineMsg = res.fine ? ` Fine assessed: Rs. ${Number(res.fine.fineAmount).toFixed(2)}.` : '';
      setFeedback({ type: 'success', text: `Loan #${res.txn.txnId} closed successfully.${fineMsg}` });
      setSelectedLoan(null); setLoanSearch(''); setReturnDate('');
    },
    onError: (error) => setFeedback({ type: 'error', text: error.message })
  });

  const bookResults = booksData?.data?.items || [];
  const memberResults = membersData?.data?.items || [];
  const loanResults = loanSearchData?.data || [];
  const overdueList = overdueData?.data || [];
  const today = new Date().toISOString().slice(0, 10);
  const latestIssueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Circulation Desk</h2>
        <p className="text-sm text-slate-500">Find books and members by name, author, email, or ISBN to issue or return items.</p>
      </div>
      <details className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
        <summary className="cursor-pointer font-semibold">What is a loan?</summary>
        <p className="mt-2 leading-6">A loan is one borrowing record for a book copy. It tracks the issue date and due date until the book is returned. Student members may hold up to 3 active loans and Regular members 5 (14 days each); Premium members may hold up to 10 (21 days each). Late returns may incur a fine.</p>
      </details>

      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-4 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{feedback.text}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-indigo-700"><ArrowUpRight className="h-5 w-5" /><h3>Issue a book</h3></div>
          <SearchResults label="Find a book" value={bookSearch} onChange={(value) => { setBookSearch(value); setSelectedBook(null); }} placeholder="Search title, author, or ISBN…">
            {!selectedBook && bookSearch.trim().length >= 2 && <div className="mt-1 max-h-40 overflow-auto rounded-md border bg-white">{bookResults.map((book) => <button type="button" key={book.bookId} onClick={() => { setSelectedBook(book); setBookSearch(`${book.title} — ${book.author}`); }} className="block w-full border-b px-3 py-2 text-left font-normal hover:bg-indigo-50"><span className="font-medium">{book.title}</span><span className="block text-xs text-slate-500">{book.author} · ISBN {book.isbn} · {book.avlCopies} available</span></button>)}</div>}
          </SearchResults>
          {selectedBook && <p className="text-xs text-emerald-700">Selected: {selectedBook.title} ({selectedBook.avlCopies} copies available)</p>}

          <SearchResults label="Find a member" value={memberSearch} onChange={(value) => { setMemberSearch(value); setSelectedMember(null); }} placeholder="Search name, email, or phone…">
            {!selectedMember && memberSearch.trim().length >= 2 && <div className="mt-1 max-h-40 overflow-auto rounded-md border bg-white">{memberResults.map(({ memberId, fullName, email, phone, membershipType, status }) => <button type="button" key={memberId} onClick={() => { setSelectedMember({ memberId, fullName, membershipType, status }); setMemberSearch(`${fullName} — #${memberId}`); }} className="block w-full border-b px-3 py-2 text-left font-normal hover:bg-indigo-50"><span className="font-medium">{fullName}</span><span className="block text-xs text-slate-500">{email} · {phone} · {membershipType} · {status}</span></button>)}</div>}
          </SearchResults>
          {selectedMember && <p className="text-xs text-emerald-700">Selected: {selectedMember.fullName} · {selectedMember.membershipType}</p>}

          <label className="block text-xs font-semibold text-slate-700">Issue date <span className="font-normal text-slate-500">(optional; defaults to today)</span><input type="date" value={issueDate} min="1900-01-01" max={latestIssueDate} onChange={(event) => setIssueDate(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
          <button type="button" onClick={() => issueMutation.mutate()} disabled={!selectedBook || !selectedMember || issueMutation.isPending} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{issueMutation.isPending ? 'Checking circulation rules…' : 'Confirm loan issue'}</button>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-emerald-700"><ArrowDownLeft className="h-5 w-5" /><h3>Return a book</h3></div>
          <SearchResults label="Find an active loan" value={loanSearch} onChange={(value) => { setLoanSearch(value); setSelectedLoan(null); }} placeholder="Search book, author, member, or email…">
            {!selectedLoan && loanSearch.trim().length >= 2 && <div className="mt-1 max-h-48 overflow-auto rounded-md border bg-white">{loanResults.map((loan) => <button type="button" key={loan.txnId} onClick={() => { setSelectedLoan(loan); setLoanSearch(`#${loan.txnId} — ${loan.book.title} / ${loan.member.fullName}`); }} className="block w-full border-b px-3 py-2 text-left font-normal hover:bg-emerald-50"><span className="font-medium">{loan.book.title}</span><span className="block text-xs text-slate-500">Loan #{loan.txnId} · {loan.member.fullName} · due {new Date(loan.dueDate).toLocaleDateString()}</span></button>)}</div>}
          </SearchResults>
          {selectedLoan && <p className="text-xs text-emerald-700">Selected loan #{selectedLoan.txnId}: {selectedLoan.book.title} borrowed by {selectedLoan.member.fullName}.</p>}
          <label className="block text-xs font-semibold text-slate-700">Return date <span className="font-normal text-slate-500">(optional; defaults to today)</span><input type="date" value={returnDate} min={selectedLoan ? new Date(selectedLoan.issueDate).toISOString().slice(0, 10) : '1900-01-01'} max={today} onChange={(event) => setReturnDate(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
          <button type="button" onClick={() => returnMutation.mutate({ txnId: selectedLoan.txnId, date: returnDate })} disabled={!selectedLoan || returnMutation.isPending} className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{returnMutation.isPending ? 'Processing return…' : 'Confirm book return'}</button>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b bg-amber-50/50 p-4 font-semibold text-amber-800"><AlertCircle className="h-5 w-5" /><h3>Active overdue loans ({overdueList.length})</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500"><th className="p-4">Loan</th><th className="p-4">Book</th><th className="p-4">Member</th><th className="p-4">Due date</th><th className="p-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{overdueList.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-slate-400">No overdue loans are active.</td></tr> : overdueList.map((loan) => <tr key={loan.txnId}>
            <td className="p-4 font-mono">#{loan.txnId}</td><td className="p-4 font-medium">{loan.book?.title}</td><td className="p-4">{loan.member?.fullName}</td><td className="p-4"><Badge variant="danger">{new Date(loan.dueDate).toLocaleDateString()}</Badge></td>
            <td className="p-4 text-right"><button onClick={() => returnMutation.mutate({ txnId: loan.txnId })} disabled={returnMutation.isPending} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Return this book</button></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}
