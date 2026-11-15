const googleBooksService = require('../../src/services/googleBooks.service');
const { AppError } = require('../../src/utils/AppError');

describe('services/googleBooks.service.js Unit Tests', () => {
  beforeEach(() => {
    googleBooksService.clearCache();
    jest.restoreAllMocks();
  });

  test('1. Valid response maps volumeInfo to library book fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalItems: 1,
        items: [{
          volumeInfo: {
            title: 'Refactoring',
            authors: ['Martin Fowler'],
            publisher: 'Addison-Wesley',
            publishedDate: '2018-11-20',
            categories: ['Computer Science']
          }
        }]
      })
    });

    const res = await googleBooksService.lookup('9780134757599');
    expect(res.title).toBe('Refactoring');
    expect(res.author).toBe('Martin Fowler');
    expect(res.publication).toBe('Addison-Wesley');
    expect(res.dateOfPublish).toBe('2018-11-20');
  });

  test('2. totalItems: 0 triggers fallback or throws 404 ISBN_NOT_FOUND', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalItems: 0 })
    });

    await expect(googleBooksService.lookup('9780134757599')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'ISBN_NOT_FOUND'
    });
  });

  test('3. Missing optional fields (year-only date "2019", no categories) applies defaults', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalItems: 1,
        items: [{
          volumeInfo: {
            title: 'Modern Architecture',
            publishedDate: '2019'
          }
        }]
      })
    });

    const res = await googleBooksService.lookup('9780134757599');
    expect(res.dateOfPublish).toBe('2019-01-01');
    expect(res.category).toBe('General');
    expect(res.author).toBe('Unknown Author');
  });

  test('4. Google Books timeout triggers fallback to Open Library', async () => {
    const fetchMock = jest.fn()
      .mockImplementationOnce(() => {
        const error = new Error('AbortError');
        error.name = 'AbortError';
        return Promise.reject(error);
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'ISBN:9780134757599': {
            title: 'Fallback Title',
            authors: [{ name: 'Fallback Author' }]
          }
        })
      });

    global.fetch = fetchMock;

    const res = await googleBooksService.lookup('9780134757599');
    expect(res.title).toBe('Fallback Title');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('5. HTTP 500 error triggers fallback to Open Library', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'ISBN:9780134757599': {
            title: 'Open Library Match'
          }
        })
      });

    global.fetch = fetchMock;

    const res = await googleBooksService.lookup('9780134757599');
    expect(res.title).toBe('Open Library Match');
  });

  test('6. Malformed JSON handled without crash', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('Unexpected token < in JSON'); }
    });

    await expect(googleBooksService.lookup('9780134757599')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'ISBN_NOT_FOUND'
    });
  });

  test('7. Second call for the same ISBN is served from in-memory cache without extra fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalItems: 1,
        items: [{ volumeInfo: { title: 'Cached Book' } }]
      })
    });
    global.fetch = fetchMock;

    const res1 = await googleBooksService.lookup('9780134757599');
    const res2 = await googleBooksService.lookup('9780134757599');

    expect(res1.title).toBe('Cached Book');
    expect(res2.title).toBe('Cached Book');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('8. Invalid ISBN string is rejected immediately without any network call', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    await expect(googleBooksService.lookup('invalid-isbn')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'INVALID_ISBN'
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

