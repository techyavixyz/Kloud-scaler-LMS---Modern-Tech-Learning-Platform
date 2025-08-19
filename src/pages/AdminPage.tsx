import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Settings, Plus, Edit, Trash2, ExternalLink, PlayCircle, Upload, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  isActive: boolean;
  createdBy: { username: string };
  createdAt: string;
}

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  author: { username: string };
  createdAt: string;
  views: number;
}

interface Playlist {
  _id: string;
  title: string;
  description: string;
  googleDriveFolderId: string;
  thumbnail: string;
  isActive: boolean;
  createdBy: { username: string };
  videos: Array<{
    title: string;
    src: string;
    duration: string;
    order: number;
  }>;
  createdAt: string;
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'course' | 'blog' | 'playlist'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  const { user } = useAuth();

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'AWS',
    difficulty: 'Beginner',
    duration: '',
    thumbnail: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'
  });

  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
    featuredImage: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'
  });

  const [playlistForm, setPlaylistForm] = useState({
    title: '',
    description: '',
    googleDriveFolderId: '',
    thumbnail: null as File | null
  });

  useEffect(() => {
    loadData();
    // Check if admin needs to change default password
    if (user?.isDefaultPassword) {
      setShowPasswordChangeModal(true);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, coursesRes, blogRes, playlistsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/users'),
        axios.get('http://localhost:3001/api/admin/courses'),
        axios.get('http://localhost:3001/api/admin/blog-posts'),
        axios.get('http://localhost:3001/api/admin/playlists')
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setBlogPosts(blogRes.data);
      setPlaylists(playlistsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`http://localhost:3001/api/admin/users/${editingItem._id}`, userForm);
      } else {
        await axios.post('http://localhost:3001/api/admin/users', userForm);
      }
      loadData();
      setShowModal(false);
      setEditingItem(null);
      setUserForm({ username: '', email: '', password: '', role: 'user' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(courseForm).forEach(key => {
        if (key === 'thumbnail' && courseForm[key] instanceof File) {
          formData.append(key, courseForm[key]);
        } else {
          formData.append(key, courseForm[key]);
        }
      });

      if (editingItem) {
        await axios.put(`http://localhost:3001/api/admin/courses/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:3001/api/admin/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      loadData();
      setShowModal(false);
      setEditingItem(null);
      setCourseForm({
        title: '',
        description: '',
        category: 'AWS',
        difficulty: 'Beginner',
        duration: '',
        thumbnail: null
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving course');
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(blogForm).forEach(key => {
        if (key === 'featuredImage' && blogForm[key] instanceof File) {
          formData.append(key, blogForm[key]);
        } else if (key === 'tags') {
          formData.append(key, blogForm.tags);
        } else {
          formData.append(key, blogForm[key]);
        }
      });

      if (editingItem) {
        await axios.put(`http://localhost:3001/api/admin/blog-posts/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:3001/api/admin/blog-posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      loadData();
      setShowModal(false);
      setEditingItem(null);
      setBlogForm({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        status: 'draft',
        featuredImage: null
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving blog post');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', playlistForm.title);
      formData.append('description', playlistForm.description);
      formData.append('googleDriveFolderId', playlistForm.googleDriveFolderId);
      if (playlistForm.thumbnail) {
        formData.append('thumbnail', playlistForm.thumbnail);
      }

      if (editingItem) {
        await axios.put(`http://localhost:3001/api/playlists/admin/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:3001/api/playlists/admin/create', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      loadData();
      setShowModal(false);
      setEditingItem(null);
      setPlaylistForm({
        title: '',
        description: '',
        googleDriveFolderId: '',
        thumbnail: null
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving playlist');
    }
  };

  const refreshPlaylistVideos = async (playlistId: string) => {
    try {
      await axios.post(`http://localhost:3001/api/playlists/admin/${playlistId}/refresh`);
      loadData();
      alert('Playlist videos refreshed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error refreshing playlist');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'playlists') {
        await axios.delete(`http://localhost:3001/api/playlists/admin/${id}`);
      } else {
        await axios.delete(`http://localhost:3001/api/admin/${type}/${id}`);
      }
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting item');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordChangeForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      await axios.post('http://localhost:3001/api/auth/change-password', {
        currentPassword: passwordChangeForm.currentPassword,
        newPassword: passwordChangeForm.newPassword
      });
      
      setShowPasswordChangeModal(false);
      setPasswordChangeForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
      
      // Update user context to remove default password flag
      if (user) {
        user.isDefaultPassword = false;
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Error changing password');
    }
  };

  const openModal = (type: 'user' | 'course' | 'blog' | 'playlist', item?: any) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      if (type === 'user') {
        setUserForm({
          username: item.username,
          email: item.email,
          password: '',
          role: item.role
        });
      } else if (type === 'course') {
        setCourseForm({
          title: item.title,
          description: item.description,
          category: item.category,
          difficulty: item.difficulty,
          duration: item.duration,
          thumbnail: null // Reset file input
        });
      } else if (type === 'blog') {
        setBlogForm({
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          category: item.category,
          tags: item.tags.join(', '),
          status: item.status,
          featuredImage: null // Reset file input
        });
      } else if (type === 'playlist') {
        setPlaylistForm({
          title: item.title,
          description: item.description,
          googleDriveFolderId: item.googleDriveFolderId,
          thumbnail: null // Reset file input
        });
      }
    }
    
    setShowModal(true);
  };

  const tabs = [
    { id: 'users', name: 'Users', icon: Users, count: users.length },
    { id: 'courses', name: 'Courses', icon: BookOpen, count: courses.length },
    { id: 'blog', name: 'Blog Posts', icon: FileText, count: blogPosts.length },
    { id: 'playlists', name: 'Playlists', icon: PlayCircle, count: playlists.length },
    { id: 'settings', name: 'Settings', icon: Settings, count: 0 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-300">Manage users, courses, and blog content</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mb-8">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <button
                  onClick={() => openModal('user')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-gray-300 font-medium">Username</th>
                      <th className="pb-3 text-gray-300 font-medium">Email</th>
                      <th className="pb-3 text-gray-300 font-medium">Role</th>
                      <th className="pb-3 text-gray-300 font-medium">Status</th>
                      <th className="pb-3 text-gray-300 font-medium">Created</th>
                      <th className="pb-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/5">
                        <td className="py-3 text-white">{user.username}</td>
                        <td className="py-3 text-gray-300">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal('user', user)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('users', user._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Course Management</h2>
                <button
                  onClick={() => openModal('course')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('course', course)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('courses', course._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{course.category}</span>
                      <span>{course.difficulty}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      By {course.createdBy.username}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blog Tab */}
          {activeTab === 'blog' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Blog Management</h2>
                <button
                  onClick={() => openModal('blog')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Post</span>
                </button>
              </div>

              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div key={post._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold">{post.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'published' 
                              ? 'bg-green-500/20 text-green-300'
                              : post.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{post.excerpt}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>By {post.author.username}</span>
                          <span>{post.category}</span>
                          <span>{post.views} views</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => openModal('blog', post)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('blog-posts', post._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Playlist Management</h2>
                <button
                  onClick={() => openModal('playlist')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Playlist</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                  <div key={playlist._id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <img
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          playlist.isActive 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {playlist.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => refreshPlaylistVideos(playlist._id)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Refresh videos from Google Drive"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('playlist', playlist)}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('playlists', playlist._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold mb-2">{playlist.title}</h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{playlist.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{playlist.videos?.length || 0} videos</span>
                        <span>By {playlist.createdBy.username}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Folder ID: {playlist.googleDriveFolderId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Google Drive OAuth</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Generate OAuth token for Google Drive integration
                  </p>
                  <a
                    href="http://localhost:3001/oauth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Generate OAuth Token</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {(showModal || showPasswordChangeModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {showPasswordChangeModal ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Change Default Password</h3>
                  {!user?.isDefaultPassword && (
                    <button
                      onClick={() => setShowPasswordChangeModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    For security reasons, you must change your default password before accessing the admin panel.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-300 text-sm">{passwordError}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordChangeForm.currentPassword}
                      onChange={(e) => setPasswordChangeForm({...passwordChangeForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeForm.newPassword}
                      onChange={(e) => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordChangeForm.confirmPassword}
                      onChange={(e) => setPasswordChangeForm({...passwordChangeForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {editingItem ? 'Edit' : 'Create'} {modalType === 'user' ? 'User' : modalType === 'course' ? 'Course' : 'Blog Post'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                {modalType === 'user' && (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        required
                        value={userForm.username}
                        onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password {editingItem && '(leave blank to keep current)'}
                      </label>
                      <input
                        type="password"
                        required={!editingItem}
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                      >
                        {editingItem ? 'Update' : 'Create'} User
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {modalType === 'course' && (
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        required
                        rows={3}
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                          value={courseForm.category}
                          onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="AWS">AWS</option>
                          <option value="Kubernetes">Kubernetes</option>
                          <option value="Docker">Docker</option>
                          <option value="Linux">Linux</option>
                          <option value="Ansible">Ansible</option>
                          <option value="GCP">GCP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                        <select
                          value={courseForm.difficulty}
                          onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 2 hours, 5 days"
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                      >
                        {editingItem ? 'Update' : 'Create'} Course
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {modalType === 'blog' && (
                  <form onSubmit={handleCreateBlog} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={blogForm.title}
                        onChange={(e) => setBlogForm({...blogForm, title: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
                      <textarea
                        required
                        rows={2}
                        maxLength={300}
                        value={blogForm.excerpt}
                        onChange={(e) => setBlogForm({...blogForm, excerpt: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Content (Markdown)</label>
                      <textarea
                        required
                        rows={8}
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({...blogForm, content: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Write your blog post content in Markdown..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <input
                          type="text"
                          required
                          value={blogForm.category}
                          onChange={(e) => setBlogForm({...blogForm, category: e.target.value})}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        <select
                          value={blogForm.status}
                          onChange={(e) => setBlogForm({...blogForm, status: e.target.value})}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({...blogForm, tags: e.target.value})}
                        placeholder="react, javascript, tutorial"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Featured Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBlogForm({...blogForm, featuredImage: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                      >
                        {editingItem ? 'Update' : 'Create'} Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {modalType === 'playlist' && (
                  <form onSubmit={handleCreatePlaylist} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={playlistForm.title}
                        onChange={(e) => setPlaylistForm({...playlistForm, title: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        rows={3}
                        value={playlistForm.description}
                        onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Google Drive Folder ID</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter Google Drive folder ID"
                        value={playlistForm.googleDriveFolderId}
                        onChange={(e) => setPlaylistForm({...playlistForm, googleDriveFolderId: e.target.value})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Get this from the Google Drive folder URL: https://drive.google.com/drive/folders/[FOLDER_ID]
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        required={!editingItem}
                        onChange={(e) => setPlaylistForm({...playlistForm, thumbnail: e.target.files?.[0] || null})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
                      >
                        {editingItem ? 'Update' : 'Create'} Playlist
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;