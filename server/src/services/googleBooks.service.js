const { isValidISBN } = require('../utils/isbn');
const { AppError } = require('../utils/AppError');

// In-memory cache for ISBN lookups
const isbnCache = new Map();

exports.lookup = async (rawIsbn) => {
  if (!isValidISBN(rawIsbn)) {
    throw new AppError('Invalid ISBN format or checksum', 422, 'INVALID_ISBN');
  }

  const cleanIsbn = rawIsbn.replace(/[-\s]/g, '');

  if (isbnCache.has(cleanIsbn)) {
    return isbnCache.get(cleanIsbn);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    const response = await fetch(gUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        
        let dateOfPublish = '2020-01-01';
        if (info.publishedDate) {
          if (info.publishedDate.length === 4) {
            dateOfPublish = `${info.publishedDate}-01-01`;
          } else {
            dateOfPublish = info.publishedDate.substring(0, 10);
          }
        }

        const mapped = {
          title: info.title || 'Unknown Title',
          author: (info.authors && info.authors.join(', ')) || 'Unknown Author',
          publication: info.publisher || 'Independent Publisher',
          dateOfPublish,
          category: (info.categories && info.categories[0]) || 'General',
          isbn: cleanIsbn
        };

        isbnCache.set(cleanIsbn, mapped);
        return mapped;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[googleBooks] Request timed out. Attempting Open Library fallback...');
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to Open Library API
  try {
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
    const olRes = await fetch(olUrl);
    if (olRes.ok) {
      const olData = await olRes.json();
      const entryKey = `ISBN:${cleanIsbn}`;
      if (olData[entryKey]) {
        const item = olData[entryKey];
        const mapped = {
          title: item.title || 'Unknown Title',
          author: (item.authors && item.authors.map(a => a.name).join(', ')) || 'Unknown Author',
          publication: (item.publishers && item.publishers[0].name) || 'Independent Publisher',
          dateOfPublish: item.publish_date ? '2020-01-01' : '2020-01-01',
          category: (item.subjects && item.subjects[0].name) || 'General',
          isbn: cleanIsbn
        };
        isbnCache.set(cleanIsbn, mapped);
        return mapped;
      }
    }
  } catch (olErr) {
    console.warn('[googleBooks] Open Library fallback error:', olErr.message);
  }

  throw new AppError('Book metadata not found for the supplied ISBN', 404, 'ISBN_NOT_FOUND');
};

exports.clearCache = () => {
  isbnCache.clear();
};

