const styles = {
  layout: "min-h-screen flex flex-col md:flex-row",
  hero: "relative flex-1 flex flex-col justify-end min-h-[280px] md:min-h-0 md:justify-center px-8 py-12 md:px-12 lg:px-16 overflow-hidden",
  heroImage: "absolute inset-0 object-cover",
  heroOverlay: "absolute inset-0 bg-slate-900/50",
  heroContent: "relative z-10 max-w-md",
  logo: "text-4xl md:text-5xl lg:text-6xl font-bold text-bernabe tracking-tight",
  tagline: "mt-6 text-lg md:text-xl text-slate-200 leading-relaxed font-medium",
  formSection:
    "flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white",
  formContainer: "w-full max-w-sm mx-auto md:mx-0",
  formTitle: "text-2xl md:text-3xl font-bold text-slate-900",
  formSubtitle: "mt-2 text-slate-500",
  form: "mt-8 space-y-5",
  input:
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition",
  label: "block text-sm font-medium text-slate-700 mb-1.5",
  button:
    "w-full py-3.5 rounded-xl font-semibold text-white bg-bernabe hover:bg-bernabe-dark focus:outline-none focus:ring-2 focus:ring-bernabe focus:ring-offset-2 transition active:scale-[0.99]",
  buttonSecondary:
    "w-full py-3 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 transition",
  link: "text-stone-600 hover:text-bernabe font-medium transition",
  divider: "relative my-6",
  dividerLine: "absolute inset-0 flex items-center",
  dividerBorder: "w-full border-t border-slate-200",
  dividerText: "relative flex justify-center text-sm",
  dividerTextSpan: "bg-white px-3 text-slate-500",
};

export default styles;
