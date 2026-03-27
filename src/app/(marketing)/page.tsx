import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

function Logo() {
  return (
    <span className="font-logo text-3xl text-[#18301d] dark:text-white">Bernabé</span>
  );
}

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border-b border-gray-100 dark:border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#18301d] dark:hover:text-white transition">
              Características
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#18301d] dark:hover:text-white transition">
              Cómo funciona
            </a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#18301d] dark:hover:text-white transition">
              Testimonios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-[#18301d] dark:text-gray-300 hover:text-[#0ca6b2] transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0ca6b2] rounded-full hover:bg-[#0a8f99] transition shadow-lg shadow-[#0ca6b2]/25"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#faddbf]/30 to-white dark:from-[#111111] dark:to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f9c70c]/20 dark:bg-[#f9c70c]/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#f9c70c] rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-[#18301d] dark:text-white">
                La plataforma para pastores y líderes
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18301d] dark:text-white leading-tight">
              Organiza tu <span className="text-[#0ca6b2]">iglesia</span>
              <br />
              y cuida a <span className="text-[#e64b27]">cada persona.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
              Seguimiento de miembros, cuidado pastoral y grupos organizados. 
              Simple y efectivo desde cualquier dispositivo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="px-8 py-4 text-center font-semibold text-white bg-[#e64b27] rounded-full hover:bg-[#d4421f] transition shadow-lg shadow-[#e64b27]/25"
              >
                Comenzar gratis
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 text-center font-semibold text-[#18301d] dark:text-white bg-white dark:bg-[#252525] border-2 border-gray-200 dark:border-[#333] rounded-full hover:border-[#0ca6b2] hover:text-[#0ca6b2] transition"
              >
                Ver cómo funciona
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#0ca6b2] border-2 border-white dark:border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-[#f9c70c] border-2 border-white dark:border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-[#e64b27] border-2 border-white dark:border-[#1a1a1a]"></div>
                <div className="w-10 h-10 rounded-full bg-[#18301d] dark:bg-[#0ca6b2] border-2 border-white dark:border-[#1a1a1a]"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-[#18301d] dark:text-white">+50 iglesias</span> ya usan Bernabé
              </p>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl dark:shadow-[#0ca6b2]/10 max-w-md">
              <Image
                src="/iglesia.jpg"
                alt="Iglesia"
                width={400}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      title: "Gestión de personas",
      description: "Registra cada persona que llega a tu iglesia. Visitantes, miembros y líderes organizados.",
      color: "#0ca6b2",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z"/>
        </svg>
      ),
      title: "Grupos y células",
      description: "Crea grupos por zona o afinidad. Cada líder ve su grupo y puede dar seguimiento.",
      color: "#e64b27",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      title: "Seguimiento efectivo",
      description: "Asegúrate de que ningún visitante se pierda. Asigna responsables y haz seguimiento real.",
      color: "#f9c70c",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      ),
      title: "Visión clara",
      description: "Conoce el estado de tu iglesia. Cuántas personas, grupos activos y más.",
      color: "#0ca6b2",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#111111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18301d] dark:text-white">
            Todo lo que necesitas para{" "}
            <span className="text-[#0ca6b2]">cuidar a tu gente</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Herramientas simples para que cada líder cuide su grupo 
            y ninguna persona se quede sin atención.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] hover:bg-white dark:hover:bg-[#252525] hover:shadow-xl dark:hover:shadow-[#0ca6b2]/5 transition-all duration-300 group border border-transparent dark:border-[#2a2a2a]"
            >
              <div
                className="w-8 h-8 mb-4"
                style={{ color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Crea tu cuenta",
      description: "Regístrate en menos de 2 minutos. Sin tarjeta de crédito.",
      image: "/hombre.jpg",
    },
    {
      number: "02",
      title: "Crea tus grupos",
      description: "Organiza células, grupos de conexión y asigna líderes a cada uno.",
      image: "/parejados.jpg",
    },
    {
      number: "03",
      title: "Cuida a cada persona",
      description: "Registra visitantes, asigna seguimiento y ve crecer tu iglesia.",
      image: "/mesaycena.jpg",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#18301d] dark:bg-[#0a1a0f]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Comienza en <span className="text-[#f9c70c]">3 simples pasos</span>
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            No necesitas ser experto en tecnología. Si puedes usar WhatsApp, 
            puedes usar Bernabé.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#18301d] dark:from-[#0a1a0f] to-transparent"></div>
                <span className="absolute bottom-4 left-4 text-5xl font-bold text-[#f9c70c]/30">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#faddbf]/30 dark:bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18301d] dark:text-white">
            Lo que dicen <span className="text-[#e64b27]">nuestros usuarios</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "Ahora cada líder puede ver su grupo y darle seguimiento. Ya no se nos pierde nadie entre tantas personas.",
              author: "Pastor Carlos",
              church: "Iglesia Vida Nueva",
            },
            {
              quote: "El seguimiento a visitantes cambió completamente. Antes se nos escapaban, ahora cada persona nueva tiene un responsable asignado.",
              author: "María González",
              church: "Centro Cristiano Fe",
            },
            {
              quote: "Mis líderes de célula están felices. Pueden ver sus miembros, registrar asistencia y reportar todo desde su celular.",
              author: "David Ramírez",
              church: "Iglesia Gracia",
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white dark:bg-[#252525] shadow-sm hover:shadow-lg dark:hover:shadow-[#0ca6b2]/5 transition border border-transparent dark:border-[#2a2a2a]"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-[#f9c70c]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-[#18301d] dark:text-white">{testimonial.author}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.church}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#111111]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#18301d] dark:text-white mb-6">
          ¿Listo para <span className="text-[#0ca6b2]">cuidar mejor</span> a tu gente?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Únete a más de 50 iglesias que ya usan Bernabé para 
          organizar sus grupos, dar seguimiento y cuidar a cada persona.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 font-semibold text-white bg-[#e64b27] rounded-full hover:bg-[#d4421f] transition shadow-lg shadow-[#e64b27]/25"
          >
            Comenzar gratis ahora
          </Link>
          <a
            href="mailto:hola@bernabe.app"
            className="px-8 py-4 font-semibold text-[#18301d] dark:text-white bg-gray-100 dark:bg-[#252525] rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition"
          >
            Contactar ventas
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-[#18301d] dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <span className="font-logo text-3xl text-white">Bernabé</span>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              La plataforma para organizar tu iglesia y cuidar a cada persona.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Producto</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-400 hover:text-white transition text-sm">Características</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition text-sm">Cómo funciona</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-white transition text-sm">Testimonios</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Precios</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Recursos</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Centro de ayuda</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Guías</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Comunidad</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                hola@bernabe.app
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Bogotá, Colombia
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Bernabé. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition text-sm">
              Política de privacidad
            </a>
            <a href="#" className="text-gray-500 hover:text-white transition text-sm">
              Términos de servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
