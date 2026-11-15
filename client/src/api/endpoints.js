import http from './http';

export const authApi = {
  login: (email, password) => http.post('/auth/login', { email, password }),
  signup: (data) => http.post('/auth/signup', data),
  profile: () => http.get('/auth/profile'),
  updateProfile: (data) => http.patch('/auth/profile', data)
};

export const booksApi = {
  list: (params) => http.get('/books', { params }),
  get: (id) => http.get(`/books/${id}`),
  create: (data) => http.post('/books', data),
  update: (id, data) => http.put(`/books/${id}`, data),
  delete: (id) => http.delete(`/books/${id}`),
  lookupISBN: (isbn) => http.get(`/books/lookup/${isbn}`)
};

export const membersApi = {
  list: (params) => http.get('/members', { params }),
  get: (id) => http.get(`/members/${id}`),
  create: (data) => http.post('/members', data),
  update: (id, data) => http.put(`/members/${id}`, data),
  renew: (id, data) => http.post(`/members/${id}/renew`, data),
  delete: (id) => http.delete(`/members/${id}`)
};

export const txnsApi = {
  issue: (data) => http.post('/txns/issue', data),
  returnBook: (id, returnDate) => http.post(`/txns/${id}/return`, { returnDate }),
  renew: (id, asOfDate) => http.post(`/txns/${id}/renew`, { asOfDate }),
  listOverdue: (asOf) => http.get('/txns/overdue', { params: { asOf } }),
  listActive: (params) => http.get('/txns/active', { params }),
  listByMember: (memberId) => http.get(`/txns/member/${memberId}`)
};

export const finesApi = {
  list: (params) => http.get('/fines', { params }),
  calculate: (asOf, rate) => http.post('/fines/calculate', { asOf, rate }),
  pay: (id, paidDate) => http.post(`/fines/${id}/pay`, { paidDate }),
  waive: (id, reason) => http.post(`/fines/${id}/waive`, { reason }),
  getOutstanding: (memberId) => http.get(`/fines/member/${memberId}/outstanding`)
};

export const staffApi = {
  list: (params) => http.get('/staff', { params }),
  create: (data) => http.post('/staff', data),
  update: (id, data) => http.put(`/staff/${id}`, data),
  delete: (id) => http.delete(`/staff/${id}`)
};

export const dealersApi = {
  list: () => http.get('/dealers'),
  create: (data) => http.post('/dealers', data),
  update: (id, data) => http.put(`/dealers/${id}`, data),
  delete: (id) => http.delete(`/dealers/${id}`)
};

export const softwareApi = {
  list: (params) => http.get('/software', { params }),
  getExpiring: (days, asOf) => http.get('/software/expiring', { params: { days, asOf } }),
  create: (data) => http.post('/software', data),
  update: (id, data) => http.put(`/software/${id}`, data),
  delete: (id) => http.delete(`/software/${id}`)
};

export const reportsApi = {
  defaulters: (asOf) => http.get('/reports/defaulters', { params: { asOf } }),
  expiries: (days, asOf) => http.get('/reports/expiries', { params: { days, asOf } }),
  circulation: (year, month) => http.get('/reports/circulation', { params: { year, month } }),
  popular: (limit) => http.get('/reports/popular', { params: { limit } }),
  financial: (year, month) => http.get('/reports/financial', { params: { year, month } })
};
