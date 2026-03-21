import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

const SAMPLE_POSTS = [
  {
    id: '1',
    type: 'puzzle',
    title: 'The Bridges of Königsberg',
    content: 'Can you walk through the city crossing each of the seven bridges exactly once? This famous problem gave birth to graph theory. Try to find a path — or prove why it\'s impossible!',
    hint: 'Think about the degree (number of connections) of each landmass.',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    authorId: '1',
    authorName: 'Academics Director',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['graph theory', 'combinatorics'],
    submissions: [],
  },
  {
    id: '2',
    type: 'fact',
    title: 'Fun Fact: The Banach-Tarski Paradox',
    content: 'In theory, you can decompose a solid ball into a finite number of pieces, then reassemble them into TWO balls identical to the original — just by rotating and translating the pieces. No stretching allowed! This relies on the Axiom of Choice and non-measurable sets.',
    hint: null,
    deadline: null,
    authorId: '1',
    authorName: 'Academics Director',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['set theory', 'measure theory'],
    submissions: [],
  },
  {
    id: '3',
    type: 'challenge',
    title: 'Weekly Challenge #1: Sum of Divisors',
    content: 'Find all positive integers n such that the sum of all divisors of n (including 1 and n) equals 2n. These numbers have a special name — can you find the pattern and name the first 3?',
    hint: 'The first such number is 6 = 1 + 2 + 3.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    authorId: '1',
    authorName: 'Academics Director',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['number theory'],
    submissions: [],
  },
];

export function DataProvider({ children }) {
  const [posts, setPosts] = useState(() => {
    const stored = localStorage.getItem('mathsoc_posts');
    return stored ? JSON.parse(stored) : SAMPLE_POSTS;
  });

  useEffect(() => {
    localStorage.setItem('mathsoc_posts', JSON.stringify(posts));
  }, [posts]);

  const createPost = (postData) => {
    const newPost = {
      id: Date.now().toString(),
      ...postData,
      submissions: [],
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const updatePost = (id, updates) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const submitAnswer = (postId, submission) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const already = p.submissions.find(s => s.userId === submission.userId);
      if (already) {
        return { ...p, submissions: p.submissions.map(s => s.userId === submission.userId ? { ...s, ...submission, updatedAt: new Date().toISOString() } : s) };
      }
      return { ...p, submissions: [...p.submissions, { ...submission, id: Date.now().toString(), submittedAt: new Date().toISOString() }] };
    }));
  };

  const getUserSubmission = (postId, userId) => {
    const post = posts.find(p => p.id === postId);
    return post?.submissions.find(s => s.userId === userId);
  };

  return (
    <DataContext.Provider value={{ posts, createPost, updatePost, deletePost, submitAnswer, getUserSubmission }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
