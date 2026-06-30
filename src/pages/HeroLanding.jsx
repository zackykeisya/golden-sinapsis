import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faGlobe, 
  faEnvelope, 
  faPhone, 
  faArrowRight,
  faTrophy,
  faUsers,
  faSchool,
  faFlask
} from '@fortawesome/free-solid-svg-icons';
import { 
  faTwitter, 
  faInstagram, 
  faLinkedin, 
  faYoutube
} from '@fortawesome/free-brands-svg-icons';

const HeroLanding = () => {
  const navigate = useNavigate();
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <FontAwesomeIcon icon={faGraduationCap} className="w-5 h-5" />
              </div>
              <span className="font-display text-xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                GoldenSinapsis
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(aboutRef)} 
                className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors duration-200"
              >
                Tentang
              </button>
              <button
                onClick={() => navigate('/join')}
                className="px-6 py-2.5 rounded-xl font-medium text-white text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Mulai Ujian
              </button>
            </div>
            <button
              onClick={() => navigate('/join')}
              className="md:hidden px-4 py-2 rounded-xl font-medium text-white text-sm bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Premium Background dengan Gradient dan Pattern */}
        <div className="absolute inset-0">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/40"></div>
          
          {/* Decorative Orbs */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-amber-300/20 to-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-l from-amber-300/20 to-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-200/5 to-transparent rounded-full blur-3xl"></div>
          
          {/* Geometric Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute top-20 right-20">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <path d="M60 0L72 45L120 60L72 75L60 120L48 75L0 60L48 45L60 0Z" fill="#D4AF37" />
              </svg>
            </div>
            <div className="absolute bottom-20 left-20">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M40 0L48 30L80 40L48 50L40 80L32 50L0 40L32 30L40 0Z" fill="#D4AF37" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-10 transform -translate-y-1/2">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="30" fill="#D4AF37" />
              </svg>
            </div>
            <div className="absolute top-1/3 right-10">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="0" y="0" width="40" height="40" fill="#D4AF37" transform="rotate(45)" />
              </svg>
            </div>
          </div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
            <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-amber-200/50 shadow-lg shadow-amber-500/10 mb-8">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-amber-700 tracking-wider uppercase">Olimpiade Sains Nasional 2026</span>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
              <span className="text-slate-800">Bersaing,</span>
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">Berprestasi,</span>
              <br />
              <span className="text-slate-800">Berkarya</span>
            </h1>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-400">
            <p className="mt-8 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              Ikuti Olimpiade Sains Nasional 2026 dan tunjukkan kemampuan terbaikmu 
              dalam kompetisi bergengsi di bidang <span className="font-medium text-amber-600">Matematika</span>, 
              <span className="font-medium text-amber-600"> Fisika</span>, 
              <span className="font-medium text-amber-600"> Kimia</span>, dan 
              <span className="font-medium text-amber-600"> Biologi</span>.
            </p>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-600 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/join')}
              className="group px-10 py-4 rounded-xl font-semibold text-white text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:-translate-y-1 transition-all duration-300"
            >
              <span className="flex items-center">
                Mulai Ujian
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-3 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="px-10 py-4 rounded-xl font-medium text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-lg transition-all duration-300"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>

          {/* Statistics - Enhanced */}
          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-800 mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: faUsers, value: '500+', label: 'Peserta', color: 'from-blue-400 to-blue-600' },
              { icon: faSchool, value: '50+', label: 'Sekolah', color: 'from-emerald-400 to-emerald-600' },
              { icon: faFlask, value: '4', label: 'Bidang Studi', color: 'from-purple-400 to-purple-600' },
              { icon: faTrophy, value: '12', label: 'Medali Emas', color: 'from-amber-400 to-amber-600' }
            ].map((stat, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-amber-300/50 hover:shadow-xl transition-all duration-300 group">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                  <FontAwesomeIcon icon={stat.icon} className="w-5 h-5" />
                </div>
                <p className="text-3xl font-display font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section ref={aboutRef} className="py-24 px-4 relative bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-semibold text-sm tracking-[0.2em] uppercase">Tentang Event</span>
            <h2 className="font-display text-4xl md:text-5xl text-slate-800 mt-3">
              Mengapa Harus <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Bergabung?</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mt-5 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: faTrophy,
                title: 'Kompetisi Bergengsi',
                description: 'Ikuti kompetisi berskala nasional dengan standar internasional dan hadiah menarik.',
                gradient: 'from-amber-400 to-amber-600'
              },
              {
                icon: faGraduationCap,
                title: 'Pengembangan Diri',
                description: 'Asah kemampuan dan kembangkan potensi dirimu di bidang sains dan teknologi.',
                gradient: 'from-blue-400 to-blue-600'
              },
              {
                icon: faGlobe,
                title: 'Jaringan Nasional',
                description: 'Bangun koneksi dengan peserta terbaik dari seluruh Indonesia.',
                gradient: 'from-emerald-400 to-emerald-600'
              }
            ].map((item, index) => (
              <div key={index} className="group bg-white rounded-2xl p-8 border border-slate-200/50 hover:border-amber-300/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 transform hover:-translate-y-2">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <FontAwesomeIcon icon={item.icon} className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }}></div>
        </div>
        
        {/* Decorative Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-600/5 rounded-full blur-2xl"></div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 mb-8">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-white/80 tracking-wider uppercase">Pendaftaran Dibuka</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Siap Menjadi <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">Pemenang?</span>
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light">
            Daftarkan dirimu sekarang dan raih prestasi terbaik di Olimpiade Sains Nasional 2026.
          </p>
          <button
            onClick={() => navigate('/join')}
            className="group px-12 py-5 rounded-2xl font-semibold text-white text-lg bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="flex items-center">
              Mulai Sekarang
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-900 text-white/60 py-16 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                  <FontAwesomeIcon icon={faGraduationCap} className="w-5 h-5" />
                </div>
                <span className="font-display text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  GoldenSinapsis
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Platform Olimpiade Sains Nasional terintegrasi untuk generasi berprestasi.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Tautan</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={() => navigate('/')} className="text-slate-400 hover:text-amber-400 transition-colors duration-200">
                    Beranda
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/join')} className="text-slate-400 hover:text-amber-400 transition-colors duration-200">
                    Masuk Ujian
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-amber-400 transition-colors duration-200">
                    Admin
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Kontak</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-3 text-slate-400">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-amber-400" />
                  <span>goldensinapsis@gmail.com</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-400">
                  <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-amber-400" />
                  <span>+62 857-7746-2326</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Ikuti Kami</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all duration-300 hover:scale-110">
                  <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all duration-300 hover:scale-110">
                  <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all duration-300 hover:scale-110">
                  <FontAwesomeIcon icon={faLinkedin} className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all duration-300 hover:scale-110">
                  <FontAwesomeIcon icon={faYoutube} className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              &copy; 2026 GoldenSinapsis. All rights reserved. Made with ❤️ for education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroLanding;