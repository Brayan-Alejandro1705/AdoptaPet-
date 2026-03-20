import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import PostCard from '../components/common/PostCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PostDetalle() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Cargar usuario actual
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }

    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success && result.data && result.data.post) {
          setPost(result.data.post);
        } else {
          setError('Publicación no encontrada');
        }
      } catch (err) {
        setError('Error al obtener la publicación');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col pt-8">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-4 text-purple-600 font-semibold hover:underline self-start"
        >
          ← Volver
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-sm">
            <p className="text-xl mb-2">😕</p>
            <p>{error}</p>
          </div>
        ) : post && currentUser ? (
          <PostCard 
            post={post} 
            currentUser={currentUser} 
            onLike={(id, isLiked) => {
               // Update local post state optimistically just like feed does (PostCard already handles its own logic, but we can refresh here if needed)
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
