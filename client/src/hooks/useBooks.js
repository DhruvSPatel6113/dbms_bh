import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '../api/endpoints';

export function useBooks(searchParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['books', searchParams],
    queryFn: () => booksApi.list(searchParams)
  });

  const createBook = useMutation({
    mutationFn: (newBook) => booksApi.create(newBook),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] })
  });

  const updateBook = useMutation({
    mutationFn: ({ id, data }) => booksApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] })
  });

  const deleteBook = useMutation({
    mutationFn: (id) => booksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] })
  });

  return {
    books: query.data?.data?.items || [],
    pagination: query.data?.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createBook,
    updateBook,
    deleteBook
  };
}
