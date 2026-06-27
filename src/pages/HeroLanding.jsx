import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroLanding = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const sponsorsRef = useRef(null);

  useEffect(() => {
    // Smooth scroll animations
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
    <div className="min-h-screen bg-white-luxury">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gold-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-display text-xl text-gold-gradient font-bold">GoldenSinapsis</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection(aboutRef)} className="text-sm text-charcoal-gray hover:text-gold transition-colors">
                Tentang
              </button>
              <button onClick={() => scrollToSection(sponsorsRef)} className="text-sm text-charcoal-gray hover:text-gold transition-colors">
                Sponsor
              </button>
              <button
                onClick={() => navigate('/join')}
                className="btn-gold px-6 py-2 rounded-lg font-medium text-white text-sm hover:shadow-gold-lg transition-all"
              >
                Mulai Ujian
              </button>
            </div>
            <button
              onClick={() => navigate('/join')}
              className="md:hidden btn-gold px-4 py-1.5 rounded-lg font-medium text-white text-sm"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gold-glow rounded-full opacity-20"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold-glow rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-glow rounded-full opacity-5"></div>
          
          {/* Geometric Decoration */}
          <div className="absolute top-20 right-20 opacity-10">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M60 0L72 45L120 60L72 75L60 120L48 75L0 60L48 45L60 0Z" fill="#D4AF37" />
            </svg>
          </div>
          <div className="absolute bottom-20 left-20 opacity-10">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M40 0L48 30L80 40L48 50L40 80L32 50L0 40L32 30L40 0Z" fill="#D4AF37" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
            <div className="inline-flex items-center space-x-2 bg-gold-light/30 px-4 py-2 rounded-full border border-gold-light/50 mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-gold-dark">Olimpiade Sains Nasional 2026</span>
            </div>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="text-charcoal">Bersaing,</span>
              <br />
              <span className="text-gold-gradient">Berprestasi,</span>
              <br />
              <span className="text-charcoal">Berkarya</span>
            </h1>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-400">
            <p className="mt-6 text-lg md:text-xl text-charcoal-gray max-w-2xl mx-auto font-light leading-relaxed">
              Ikuti Olimpiade Sains Nasional 2026 dan tunjukkan kemampuan terbaikmu 
              dalam kompetisi bergengsi di bidang Matematika, Fisika, Kimia, dan Biologi.
            </p>
          </div>

          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-600 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/join')}
              className="btn-gold px-10 py-4 rounded-xl font-semibold text-white text-lg hover:shadow-gold-lg hover:transform hover:-translate-y-1 transition-all duration-300 group"
            >
              <span className="flex items-center">
                Mulai Ujian
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="px-10 py-4 rounded-xl font-medium text-charcoal-gray border-2 border-charcoal-gray/20 hover:border-gold hover:text-gold transition-all duration-300"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>

          {/* Statistics */}
          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-800 mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <p className="text-3xl font-display text-gold">500+</p>
              <p className="text-xs text-charcoal-gray/60">Peserta</p>
            </div>
            <div>
              <p className="text-3xl font-display text-gold">50+</p>
              <p className="text-xs text-charcoal-gray/60">Sekolah</p>
            </div>
            <div>
              <p className="text-3xl font-display text-gold">4</p>
              <p className="text-xs text-charcoal-gray/60">Bidang Studi</p>
            </div>
            <div>
              <p className="text-3xl font-display text-gold">12</p>
              <p className="text-xs text-charcoal-gray/60">Medali Emas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section ref={aboutRef} className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold font-medium text-sm tracking-wider uppercase">Tentang Event</span>
            <h2 className="font-display text-4xl md:text-5xl text-charcoal mt-2">
              Mengapa Harus <span className="text-gold-gradient">Bergabung?</span>
            </h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏆',
                title: 'Kompetisi Bergengsi',
                description: 'Ikuti kompetisi berskala nasional dengan standar internasional dan hadiah menarik.'
              },
              {
                icon: '🎯',
                title: 'Pengembangan Diri',
                description: 'Asah kemampuan dan kembangkan potensi dirimu di bidang sains dan teknologi.'
              },
              {
                icon: '🌐',
                title: 'Jaringan Nasional',
                description: 'Bangun koneksi dengan peserta terbaik dari seluruh Indonesia.'
              }
            ].map((item, index) => (
              <div key={index} className="card-gold p-8 text-center hover:shadow-gold transition-all duration-300 group">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-display text-xl text-charcoal mb-2">{item.title}</h3>
                <p className="text-charcoal-gray text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SPONSORS & ADS SECTION ============ */}
      <section ref={sponsorsRef} className="py-24 px-4 bg-gold-glow/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold font-medium text-sm tracking-wider uppercase">Sponsor & Partner</span>
            <h2 className="font-display text-4xl md:text-5xl text-charcoal mt-2">
              Didukung <span className="text-gold-gradient">Oleh</span>
            </h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto mt-4 rounded-full"></div>
          </div>

          {/* Sponsor Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Kemendikbud', logo: '📚', bg: 'bg-blue-50' },
              { name: 'BRIN', logo: '🔬', bg: 'bg-purple-50' },
              { name: 'LIPI', logo: '🧪', bg: 'bg-green-50' },
              { name: 'ITB', logo: '🏛️', bg: 'bg-orange-50' },
            ].map((sponsor, index) => (
              <div key={index} className={`${sponsor.bg} rounded-xl p-6 flex flex-col items-center justify-center border-2 border-transparent hover:border-gold transition-all duration-300 group`}>
                <div className="text-4xl mb-2">{sponsor.logo}</div>
                <p className="text-sm font-medium text-charcoal-gray">{sponsor.name}</p>
              </div>
            ))}
          </div>

          {/* ADS / Partner Banner */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-gold p-6 border-2 border-gold-light/30 hover:border-gold transition-all">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">📖</div>
                <div>
                  <h4 className="font-semibold text-charcoal">Penerbit Erlangga</h4>
                  <p className="text-xs text-charcoal-gray/60">Partner Buku & Pendidikan</p>
                </div>
              </div>
            </div>
            <div className="card-gold p-6 border-2 border-gold-light/30 hover:border-gold transition-all">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">💻</div>
                <div>
                  <h4 className="font-semibold text-charcoal">Ruangguru</h4>
                  <p className="text-xs text-charcoal-gray/60">Platform Belajar Online</p>
                </div>
              </div>
            </div>
            <div className="card-gold p-6 border-2 border-gold-light/30 hover:border-gold transition-all">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">🏅</div>
                <div>
                  <h4 className="font-semibold text-charcoal">Komite Olimpiade</h4>
                  <p className="text-xs text-charcoal-gray/60">Penyelenggara Resmi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold-gradient opacity-5"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl text-charcoal mb-4">
            Siap Menjadi <span className="text-gold-gradient">Pemenang?</span>
          </h2>
          <p className="text-charcoal-gray text-lg mb-8 max-w-2xl mx-auto">
            Daftarkan dirimu sekarang dan raih prestasi terbaik di Olimpiade Sains Nasional 2026.
          </p>
          <button
            onClick={() => navigate('/join')}
            className="btn-gold px-12 py-4 rounded-xl font-semibold text-white text-lg hover:shadow-gold-lg hover:transform hover:-translate-y-1 transition-all duration-300 animate-pulse-gold group"
          >
            <span className="flex items-center">
              Mulai Sekarang
              <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-charcoal text-white/60 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-display text-lg text-gold">GoldenSinapsis</span>
            </div>
            <p className="text-sm text-white/40">Platform Olimpiade Sains Nasional terintegrasi.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Tautan</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/')} className="hover:text-gold transition-colors">Beranda</button></li>
              <li><button onClick={() => navigate('/join')} className="hover:text-gold transition-colors">Masuk Ujian</button></li>
              <li><button onClick={() => navigate('/admin')} className="hover:text-gold transition-colors">Admin</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 info@goldensinapsis.id</li>
              <li>📞 (021) 1234-5678</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Ikuti Kami</h4>
            <div className="flex space-x-4 text-2xl">
              <span className="hover:text-gold transition-colors cursor-pointer">📱</span>
              <span className="hover:text-gold transition-colors cursor-pointer">🐦</span>
              <span className="hover:text-gold transition-colors cursor-pointer">📸</span>
              <span className="hover:text-gold transition-colors cursor-pointer">💼</span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/30">
          © 2026 GoldenSinapsis. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HeroLanding;