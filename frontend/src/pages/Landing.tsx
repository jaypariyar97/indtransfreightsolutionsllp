import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, Shield, Clock, Phone, Mail, MapPin, ChevronRight, Award, Users, Globe, Search } from 'lucide-react';
import { getFileUrl } from '../services/api';

// Use the relative `/api` path so the Vite dev server (and the production
// reverse proxy) forward the call to Spring Boot. Hard-coding localhost:8080
// breaks the moment the page is served from anywhere other than the dev box.
// const BACKEND_URL = '/api';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface GalleryImage {
  id: string;
  imagePath: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function Landing() {
  const navigate = useNavigate();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = trackingNumber.trim();
    if (!v) return;
    navigate(`/track/${encodeURIComponent(v)}`);
  };

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/gallery`);
      if (response.ok) {
        const data = await response.json();
        // Filter only active images
        const activeImages = data.filter((img: GalleryImage) => img.isActive);
        setGalleryImages(activeImages);
      }
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  // Helper function to get full image URL
  // const getImageUrl = (imagePath: string) => {
  //   if (!imagePath) return '/placeholder-image.jpg';
  //   return getFileUrl(imagePath);
  // };
      const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '/placeholder-image.jpg';
        if (/^https?:\/\//i.test(imagePath)) return imagePath; // already absolute
        
        const filename = imagePath.split('/').pop();
        if (!filename) return '/placeholder-image.jpg';
        
        const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
        return `${base}/gallery/files/${filename}`;
      };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* 1. Logo Area - Left Side */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <img src="/logo.jpeg" alt="INDTRANS" className="h-12 w-auto" />
              <div className="leading-none">
                <h1 className="text-base md:text-lg font-black text-gray-900 tracking-wider uppercase">
                  INDTRANS FREIGHT SOLUTIONS LLP
                  {/* <span className="text-orange-600">LLP</span> */}
                </h1>
                <p className="text-[9px] text-gray-500 font-semibold tracking-[0.15em] mt-0.5 uppercase">
                  Your Reliable Transportation Partner
                </p>
              </div>
            </div>

            {/* 2. Navigation Menu - Center */}
            <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
              <a href="#home" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Home</a>
              <a href="#track" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Track</a>
              <a href="#services" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Services</a>
              <a href="#gallery" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Gallery</a>
              <a href="#about" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">About</a>
              <a href="#why-us" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Why Us</a>
              <a href="#contact" className="text-sm font-bold text-gray-700 hover:text-orange-600 uppercase tracking-wide transition">Contact</a>
            </div>

            {/* 3. Buttons - Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => navigate('/admin/login')}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-orange-600 hover:text-orange-600 transition font-bold uppercase text-[10px] sm:text-xs tracking-wide whitespace-nowrap"
              >
                Login
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 transition font-bold uppercase text-xs tracking-wide"
              >
                Get a Quote
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920" alt="Truck" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Reliable Freight Solutions. <span className="text-orange-500">Seamless.</span> Nationwide.
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl">
            End-to-end freight coordination for FTL and ODC transportation across India. 
            Connecting businesses with precision, reliability, and speed.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
            >
              Get a Free Quote
            </button>
            <button 
              onClick={() => document.getElementById('track')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition flex items-center gap-2"
            >
              Track Shipment <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Public GCN tracker — Amazon/Flipkart style. Anyone with a GCN
              number can paste it here and jump to the live timeline. */}
          <form
            id="track"
            onSubmit={handleTrackingSubmit}
            className="mt-12 bg-white/95 backdrop-blur rounded-2xl p-5 shadow-2xl max-w-2xl border border-orange-200"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Track your shipment
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="Enter GCN tracking number (e.g. GCN240001)"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-mono"
                />
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg uppercase text-sm tracking-wide"
              >
                Track
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Real-time updates from origin to delivery — no login required.
            </p>
          </form>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-gray-700">
            <div>
              <div className="text-4xl font-bold text-orange-500">500+</div>
              <div className="text-gray-400 mt-1">Shipments Delivered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500">50+</div>
              <div className="text-gray-400 mt-1">Successful Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500">Pan India</div>
              <div className="text-gray-400 mt-1">Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500">2022</div>
              <div className="text-gray-400 mt-1">Est. Year</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-orange-600 font-semibold mb-2">WHAT WE DELIVER</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Core Transportation <span className="text-orange-600">Services</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive freight and logistics solutions engineered for India's most demanding supply chains.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* FTL */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Truck className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Full Truck Load (FTL)</h3>
              <p className="text-gray-600 mb-6">Reliable full truck load services across India with a diverse fleet to match every need.</p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Full body truck - Light vehicle and heavy vehicle
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Closed container truck
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Refrigerator truck
                </li>
              </ul>
              <button className="text-orange-600 font-semibold flex items-center gap-2 hover:gap-3 transition">
                Learn More <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* ODC */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Package className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">ODC and Project Cargo</h3>
              <p className="text-gray-600 mb-6">Specialized ODC and project cargo solutions for oversized and heavy-duty requirements.</p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  ODC Truck 20-32ft
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Trailers HBT
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Trailers SLBT, LBT
                </li>
              </ul>
              <button className="text-orange-600 font-semibold flex items-center gap-2 hover:gap-3 transition">
                Learn More <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">500+</div>
              <div className="text-sm text-gray-600 mt-1">Shipments Delivered</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">50+</div>
              <div className="text-sm text-gray-600 mt-1">Successful Clients</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">Pan India</div>
              <div className="text-sm text-gray-600 mt-1">Coverage</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">2022</div>
              <div className="text-sm text-gray-600 mt-1">Est. Year</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600 mt-1">Operations</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">7+</div>
              <div className="text-sm text-gray-600 mt-1">Industry Sectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-orange-600 font-semibold mb-2">WHO WE ARE</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                India's Trusted <span className="text-orange-600">Freight Partner</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Since 2022, INDTRANS has been connecting businesses with reliable freight solutions across India — 
                delivering precision, commitment, and end-to-end coordination.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We started with a single vision: make freight movement reliable, predictable, and efficient. 
                As a freight solutions and coordination company, we bring together the right vehicles, routes, 
                and partners to move your cargo safely and on time.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Our strength lies in deep industry relationships and operational expertise — from Full Truck Load 
                coordination to complex ODC and project cargo movements requiring specialized trailers.
              </p>
              <div className="flex gap-4">
                <button className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition">
                  Partner With Us
                </button>
                <button 
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-orange-600 hover:text-orange-600 transition"
                >
                  View Services
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-orange-300"></div>
              <div className="space-y-8">
                <div className="relative flex gap-6">
                  <div className="w-4 h-4 bg-orange-600 rounded-full border-4 border-white shadow mt-1.5"></div>
                  <div>
                    <div className="text-orange-600 font-bold mb-1">2022</div>
                    <p className="text-gray-600">Founded in Mumbai — a dedicated freight solutions company coordinating FTL and ODC movement across India</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="w-4 h-4 bg-orange-600 rounded-full border-4 border-white shadow mt-1.5"></div>
                  <div>
                    <div className="text-orange-600 font-bold mb-1">2022</div>
                    <p className="text-gray-600">Onboarded first enterprise clients in FMCG and Engineering sectors</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="w-4 h-4 bg-orange-600 rounded-full border-4 border-white shadow mt-1.5"></div>
                  <div>
                    <div className="text-orange-600 font-bold mb-1">2023</div>
                    <p className="text-gray-600">Expanded network to cover major industrial corridors across Maharashtra and Gujarat</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="w-4 h-4 bg-orange-600 rounded-full border-4 border-white shadow mt-1.5"></div>
                  <div>
                    <div className="text-orange-600 font-bold mb-1">2023</div>
                    <p className="text-gray-600">Added ODC and project cargo capabilities including heavy trailer coordination</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="w-4 h-4 bg-orange-600 rounded-full border-4 border-white shadow mt-1.5"></div>
                  <div>
                    <div className="text-orange-600 font-bold mb-1">2024</div>
                    <p className="text-gray-600">Crossed 500+ shipments milestone, serving 50+ clients across 7 industry sectors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="py-20 bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-orange-600 font-semibold mb-2">OUR ADVANTAGE</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why India's Best Choose <span className="text-orange-600">INDTRANS</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We combine decades of logistics experience with cutting-edge technology to deliver what others promise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-orange-600">A</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% <span className="text-sm font-normal text-gray-600">Fleet Coverage</span></h3>
              <h4 className="font-semibold text-gray-900 mb-2">Real-Time GPS Tracking</h4>
              <p className="text-gray-600 text-sm">Track every shipment live on our digital platform. Automated alerts and ETA updates keep your team informed at every milestone.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">28 <span className="text-sm font-normal text-gray-600">States</span></h3>
              <h4 className="font-semibold text-gray-900 mb-2">Pan-India Network</h4>
              <p className="text-gray-600 text-sm">Reach any destination across 28 states with our hub-and-spoke distribution model and last-mile delivery partners.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% <span className="text-sm font-normal text-gray-600">Compliant</span></h3>
              <h4 className="font-semibold text-gray-900 mb-2">Regulatory Compliance</h4>
              <p className="text-gray-600 text-sm">Automated GST e-way bill generation, permit management, and compliance documentation for stress-free regulatory adherence.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">99.2% <span className="text-sm font-normal text-gray-600">On-Time</span></h3>
              <h4 className="font-semibold text-gray-900 mb-2">Guaranteed SLAs</h4>
              <p className="text-gray-600 text-sm">Industry-leading 99.2% on-time delivery backed by contractual SLAs and dedicated operations teams at every node.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 <span className="text-sm font-normal text-gray-600">Support</span></h3>
              <h4 className="font-semibold text-gray-900 mb-2">24/7 Dedicated Support</h4>
              <p className="text-gray-600 text-sm">A dedicated relationship manager and 24×7 operations team ensure any issue is resolved before it affects your supply chain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - DYNAMIC */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-orange-600 font-semibold mb-2">OUR GALLERY</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fleet & <span className="text-orange-600">Operations</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take a look at our modern fleet, warehousing facilities, and operational excellence across India.
            </p>
          </div>

          {loadingGallery ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No gallery images available</p>
              <p className="text-gray-400 text-sm">Check back soon for updates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image) => (
                <div key={image.id} className="group relative overflow-hidden rounded-xl shadow-lg cursor-pointer">
                  <img 
                    src={getImageUrl(image.imagePath)}
                    alt={image.title} 
                    className="w-full h-64 object-cover transform group-hover:scale-110 transition duration-500"
                    onError={(e) => {
                      console.error('Failed to load gallery image:', image.imagePath);
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-white font-bold text-lg">{image.title}</h3>
                      <p className="text-gray-300 text-sm">{image.description || image.category}</p>
                    </div>
                  </div>
                  {image.category && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {image.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Request a <span className="text-orange-600">Free Quote</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tell us about your freight requirements and we'll get back within 2 business hours with a tailored solution.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">HEAD OFFICE</h4>
                    <p className="text-gray-600 text-sm">103, 1st Floor Grohitam Premises, APMC Market Sector 19, Navi Mumbai, Maharashtra 400703</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">PHONE</h4>
                    <p className="text-gray-600 text-sm">+91 8850397196</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">EMAIL</h4>
                    <p className="text-gray-600 text-sm">operations@indtransfreightsolutions.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">OPERATIONS</h4>
                    <p className="text-gray-600 text-sm">24/7 — 365 days a year</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Form */}
            <div className="lg:col-span-2 bg-orange-50 p-8 rounded-xl">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">FULL NAME *</label>
                    <input type="text" placeholder="Rajesh Kumar" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">COMPANY NAME *</label>
                    <input type="text" placeholder="Your Company Ltd." className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">EMAIL ADDRESS *</label>
                    <input type="email" placeholder="you@company.in" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PHONE NUMBER</label>
                    <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SERVICE REQUIRED *</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                    <option value="">Select a service...</option>
                    <option value="ftl">Full Truck Load (FTL)</option>
                    <option value="odc">ODC and Project Cargo</option>
                    <option value="both">Both FTL & ODC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SHIPMENT DETAILS</label>
                  <textarea 
                    rows={4} 
                    placeholder="Origin, destination, cargo type, weight/volume, frequency, special requirements..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  ></textarea>
                </div>

                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2">
                  Submit Quote Request <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-center text-sm text-gray-500">We typically respond within 2 business hours. No spam, ever.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <img src="/logo.jpeg" alt="INDTRANS" className="h-10 mb-4" />
              <p className="text-gray-400 text-sm mb-4">
                Freight solutions and coordination for FTL and ODC transportation across India. 
                Trusted by 50+ clients in 7 industry sectors since 2022.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-orange-600 transition">
                  <span className="text-xs">in</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-orange-600 transition">
                  <span className="text-xs">X</span>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-orange-600 transition">
                  <span className="text-xs">f</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">SERVICES</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Full Truck Load (FTL)</a></li>
                <li><a href="#" className="hover:text-white transition">Full Body Truck - Light & Heavy</a></li>
                <li><a href="#" className="hover:text-white transition">Closed Container Truck</a></li>
                <li><a href="#" className="hover:text-white transition">Refrigerator Truck</a></li>
                <li><a href="#" className="hover:text-white transition">ODC and Project Cargo</a></li>
                <li><a href="#" className="hover:text-white transition">Trailers HBT, SLBT, LBT</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">COMPANY</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#why-us" className="hover:text-white transition">Why Choose Us</a></li>
                <li><a href="#services" className="hover:text-white transition">Our Services</a></li>
                <li><a href="#gallery" className="hover:text-white transition">Gallery</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">CONTACT</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>103, 1st Floor Grohitam Premises, APMC Market Sector 19, Navi Mumbai, Maharashtra 400703</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span>+91 8850397196</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span>operations@indtransfreightsolutions.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2026 INDTRANS Freight Solutions LLP. All rights reserved.</p>
            <p className="text-sm text-gray-500">Built with Java using <a href="#" className="underline">@mind</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}