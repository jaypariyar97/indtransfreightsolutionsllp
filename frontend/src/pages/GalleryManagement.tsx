import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api, getFileUrl } from '../services/api';
import { Upload, Trash2, Edit2, X, Save, Image as ImageIcon, Calendar } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface GalleryImage {
  id: string;
  imagePath: string;
  title: string;
  description: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const data = await api.get<GalleryImage[]>('/gallery/admin');
      // Only show non-deleted entries — backend uses soft-delete (isActive=false).
      setImages(data.filter((img) => img.isActive));
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !title) {
      notify('Please select an image and enter a title');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);

      await api.post('/gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setPreviewUrl('');
      setTitle('');
      setDescription('');
      setCategory('');
      fetchImages();
      notify('Photo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      notify('Failed to upload photo');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setSelectedImage(image);
    setTitle(image.title);
    setDescription(image.description);
    setCategory(image.category);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedImage || !title) {
      notify('Please enter a title');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);

      await api.put(`/gallery/${selectedImage.id}`, formData);

      setShowEditModal(false);
      setSelectedImage(null);
      setTitle('');
      setDescription('');
      setCategory('');
      fetchImages();
      notify('Photo updated successfully!');
    } catch (error) {
      console.error('Failed to update image:', error);
      notify('Failed to update photo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/gallery/${id}`);
      // Optimistic update so the tile disappears immediately,
      // even before the next fetch returns.
      setImages((prev) => prev.filter((img) => img.id !== id));
      fetchImages();
      notify('Photo deleted successfully');
    } catch (error) {
      console.error('Failed to delete image:', error);
      notify('Failed to delete photo');
    }
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setShowEditModal(false);
    setUploadFile(null);
    setPreviewUrl('');
    setTitle('');
    setDescription('');
    setCategory('');
    setSelectedImage(null);
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-image.jpg';
    return getFileUrl(imagePath);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
            <p className="text-gray-600">Upload and manage shipment photos</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Add Photo Details</h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {previewUrl ? (
                        <div className="relative">
                          <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                          <button
                            onClick={() => {
                              setUploadFile(null);
                              setPreviewUrl('');
                            }}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-12">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">Click to upload or drag and drop</p>
                          <label className="cursor-pointer">
                            <span className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                              Choose File
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. FTL delivery to Pune - March 2024"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Route, cargo type, or any notable details..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select Category</option>
                        <option value="FTL">FTL (Full Truck Load)</option>
                        <option value="LTL">LTL (Less Than Truck Load)</option>
                        <option value="ODC">ODC (Over Dimensional Cargo)</option>
                        <option value="Container">Container</option>
                        <option value="Special">Special Cargo</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpload}
                        disabled={!uploadFile || !title}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        Save Photo
                      </button>
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Edit Photo Details</h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div>
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <img 
                        src={getImageUrl(selectedImage.imagePath)} 
                        alt={selectedImage.title} 
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Failed to load image in edit modal:', selectedImage.imagePath);
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. FTL delivery to Pune - March 2024"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Route, cargo type, or any notable details..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select Category</option>
                        <option value="FTL">FTL (Full Truck Load)</option>
                        <option value="LTL">LTL (Less Than Truck Load)</option>
                        <option value="ODC">ODC (Over Dimensional Cargo)</option>
                        <option value="Container">Container</option>
                        <option value="Special">Special Cargo</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdate}
                        disabled={!title}
                        className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        Update Photo
                      </button>
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg transition">
              <div className="relative">
                <img 
                  src={getImageUrl(image.imagePath)}
                  alt={image.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    console.error('Failed to load image:', image.imagePath);
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(image)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {image.category && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {image.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-gray-600 mb-3">{image.description}</p>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(image.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No photos uploaded yet</p>
            <p className="text-gray-400 text-sm">Click "Upload Photo" to add your first image</p>
          </div>
        )}
      </main>
    </div>
  );
}