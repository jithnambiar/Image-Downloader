import React, { useState } from 'react';
import { 
  BookOpen, Sparkles, ShieldCheck, Heart, 
  HelpCircle, ChevronRight, FileText, Download, 
  Layout, ListChecks, ArrowLeft, ArrowUpRight, 
  Compass, Clock, Tag, ExternalLink, Calendar, User, ArrowRight
} from 'lucide-react';

interface BlogPageProps {
  onBackToDashboard?: () => void;
}

export default function BlogPage({ onBackToDashboard }: BlogPageProps) {
  const [activeHeading, setActiveHeading] = useState<string>('intro');

  const scrollToSection = (id: string) => {
    setActiveHeading(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-16 animate-fadeIn" id="blog-workspace">
      
      {/* Blog Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-[32px] p-6 md:p-12 border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-from/15 to-brand-to/15 mix-blend-multiply opacity-60 pointer-events-none" />
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-brand-glow blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 max-w-3xl">
          {onBackToDashboard && (
            <button 
              onClick={onBackToDashboard}
              className="self-start flex items-center gap-2 text-xs font-bold text-brand-light bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Crawler Dashboard</span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              SEO Masterclass
            </span>
            <span className="text-[10px] font-bold font-mono text-brand-light uppercase tracking-widest bg-brand-from/10 px-3 py-1 rounded-full border border-brand-from/20">
              Bulk Download Guide
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>8 Min Read</span>
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display leading-tight">
            The Ultimate Guide to Bulk Image Downloading &amp; Web Scraping in 2026
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
            Learn the core principles behind batch visual asset retrieval, image crawling mechanics, dynamic size filtering, and local client-side GDPR-compliant data compression techniques.
          </p>

          <div className="flex items-center gap-4 border-t border-slate-800 pt-6 mt-2">
            <div className="h-10 w-10 rounded-full bg-brand-from/20 border border-brand-from/40 flex items-center justify-center text-sm font-bold text-white shadow-inner font-mono">
              BID
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-200">Bulk Image Downloader Team</p>
              <p className="text-slate-400 mt-0.5">Published on July 18, 2026 · Updated 10m ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar (Desktop table of contents) */}
        <aside className="lg:col-span-3 sticky top-24 hidden lg:flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            <span>Table of Contents</span>
          </h3>
          <nav className="flex flex-col gap-2 text-xs">
            <button
              onClick={() => scrollToSection('intro')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'intro' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              1. Introduction to Web Crawling
            </button>
            <button
              onClick={() => scrollToSection('mechanics')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'mechanics' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              2. How Web Image Scrapers Work
            </button>
            <button
              onClick={() => scrollToSection('platforms')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'platforms' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              3. Platform Extraction Tactics
            </button>
            <button
              onClick={() => scrollToSection('transcoding')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'transcoding' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              4. Transcoding &amp; Compression
            </button>
            <button
              onClick={() => scrollToSection('gdpr')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'gdpr' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              5. Ethics &amp; GDPR Sandbox Rules
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'comparison' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              6. Workflow Comparison Table
            </button>
            <button
              onClick={() => scrollToSection('checklist')}
              className={`text-left font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                activeHeading === 'checklist' 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              7. Ultimate Image SEO Checklist
            </button>
          </nav>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-800/80 rounded-xl mt-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Ready to crawl?
            </span>
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              Launch our live sandbox compiler tool to extract up to 100 images per batch instantly.
            </p>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="w-full mt-2 py-2 bg-brand hover:bg-brand-hover text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Launch Scraper</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </aside>

        {/* Rich SEO Article Body */}
        <div className="lg:col-span-9 flex flex-col gap-10 text-slate-650 dark:text-slate-300 text-sm md:text-base leading-relaxed">
          
          {/* Section 1: Intro */}
          <section id="intro" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">1.</span>
              Introduction to Web Image Crawling and Asset Gathering
            </h2>
            
            <p>
              In modern digital marketing, web design, and algorithmic visual training research, media assets are the primary raw material. Retrieving hundreds or thousands of visuals manually is incredibly tedious. A professional <strong>bulk image downloader</strong> or <strong>web image scraper</strong> replaces hundreds of manual mouse clicks with automated, high-performance web spiders. This allows digital designers, product managers, and educational teams to instantly archive references, curate layouts, and build mood boards.
            </p>

            <p>
              As the web transforms from static server-side structures to client-rendered single-page applications (SPAs), traditional crawler systems frequently break. Modern platforms like Pinterest, Instagram, and major news networks utilize lazy loading, dynamically injected responsive <code>srcset</code> arrays, and obfuscated source maps. An advanced downloader sandbox must be smart enough to identify authentic, highest-resolution images while filtering out noisy tracking pixels, decorative vector layout spacers, and user-avatar thumbnails.
            </p>

            {/* Premium Article Illustration 1 */}
            <div className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg relative bg-slate-900 group">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" 
                alt="Web crawling server analytics dashboard showing high speed data pipelines, database nodes and digital asset scrapers" 
                referrerPolicy="no-referrer"
                className="w-full object-cover max-h-[340px] opacity-80 group-hover:scale-101 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-slate-300 flex justify-between items-center bg-slate-950/70 p-3 rounded-lg backdrop-blur-md border border-slate-850">
                <span className="font-semibold flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  Asset Extraction Sandbox Engine
                </span>
                <span>Keyword Focus: Bulk Image Downloader</span>
              </div>
            </div>

            <p>
              Our research team has analyzed several web scraper structures to compile the ultimate standard for dynamic, real-time visual extraction pipelines. In this masterclass, we will review extraction mechanics, sizing optimization algorithms, and legal GDPR frameworks.
            </p>
          </section>

          {/* Section 2: Mechanics */}
          <section id="mechanics" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">2.</span>
              How Web Image Scrapers Work Behind the Scenes
            </h2>
            
            <p>
              At its core, a <strong>batch image download</strong> workspace uses a scraper engine designed to crawl target sites through a multi-tier pipeline. Let's analyze exactly how an engine retrieves high-resolution files from a raw HTML response:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-0.5 rounded-md">
                  Phase 1
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 text-xs">HTML &amp; DOM Parsing</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  The parser breaks down document structures to discover standard tags, picture arrays, CSS backdrops, and interactive hyperlinks.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-md">
                  Phase 2
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 text-xs">Dynamic JSON Extraction</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  If the target is an SPA (React/Vue), the engine intercepts hydration state payloads, embedded script blocks, and background GraphQL APIs.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-mono font-bold text-purple-500 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-md">
                  Phase 3
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 text-xs">Attribute Sieve Filter</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Our system computes dimensions, filters out duplicates, transposes relative paths, and resolves CDN signatures automatically.
                </p>
              </div>
            </div>

            <p>
              One of the biggest issues in basic browser scrapers is path resolution. Sites frequently use relative URLs like <code>/static/media/logo.png</code>. Without a robust resolver, a bulk downloader would output broken image links. Our crawler intercepts the primary document host and base tag attributes, transforming relative paths into complete, authorized absolute URIs (e.g., <code>https://targetsite.com/static/media/logo.png</code>) before initiating the download task.
            </p>

            <blockquote className="border-l-4 border-brand bg-slate-50 dark:bg-slate-950 px-5 py-3.5 rounded-r-2xl my-3 text-xs md:text-sm font-semibold italic text-slate-500 dark:text-slate-400">
              "A modern web crawler doesn't just read img tags. It must reconstruct responsive source sets and look deep into the client-rendered scripts to locate pristine raw media files."
            </blockquote>
          </section>

          {/* Section 3: Platform Specifics */}
          <section id="platforms" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">3.</span>
              Platform Extraction Tactics: From Pinterest Pin Grabbers to Social Media crawlers
            </h2>
            
            <p>
              Popular social hubs and design mood-board systems employ complex layouts to deter automatic harvesting. To extract assets successfully, you need to understand the platform-specific behaviors. Let's look at how an advanced <strong>Pinterest image downloader</strong> works to pull original visual data:
            </p>

            <div className="flex flex-col gap-3 my-2 text-xs">
              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 font-bold">P</div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">The Pinterest pin layout logic</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    Pinterest serves highly compressed preview images on feed boards, saving full high-resolution assets exclusively within individual Pin details. A custom crawler targets individual Pin IDs to locate the original JSON script elements containing references to the raw original dimensions (often named <code>originals</code> in their data payload).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold">I</div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Unsplash, Pexels, and Stock Platforms</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    Stock databases typically mask full-res photos behind responsive canvas layers. The crawler scans metadata descriptors to target direct CDN nodes, completely skipping low-res thumbnails and watermark overlays to download pure, pristine pixels.
                  </p>
                </div>
              </div>
            </div>

            <p>
              Additionally, the rise of <strong>HTML image extractor</strong> scripts allows designers to quickly target specific nested content. By specifying exact container nodes (e.g., <code>div.article-content</code>), a sandbox downloader bypasses header menus, ad sections, and footer icons, focusing purely on article figures and primary illustrations.
            </p>
          </section>

          {/* Section 4: Transcoding & Sizing */}
          <section id="transcoding" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">4.</span>
              The Science of Format Transcoding &amp; Lossless Image Compression
            </h2>
            
            <p>
              When dealing with bulk media jobs, files sizes accumulate rapidly. A batch download of 100 raw photography files can exceed 300MB, slowing down browser tabs and consuming extensive bandwidth. An ideal web crawler workspace should integrate <strong>format transcoding</strong> and <strong>batch image compression</strong> directly into the client download step.
            </p>

            <p>
              Our recommended pipeline uses an in-browser <code>CanvasRenderingContext2D</code> engine to compress and re-encode binary image data before archiving. By drawing a retrieved image blob onto an offscreen canvas, the script can export a compressed WebP file with adjustable quality sliders (e.g., a setting of 80% reduces size by up to 75% with virtually zero visible difference in fidelity).
            </p>

            {/* Premium Article Illustration 2 */}
            <div className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg relative bg-slate-900 group">
              <img 
                src="https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80" 
                alt="Digital content creation studio with responsive designers compiling high quality web graphics, optimizing image layout sizes and downloading assets" 
                referrerPolicy="no-referrer"
                className="w-full object-cover max-h-[340px] opacity-80 group-hover:scale-101 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-slate-300 flex justify-between items-center bg-slate-950/70 p-3 rounded-lg backdrop-blur-md border border-slate-850">
                <span className="font-semibold flex items-center gap-1.5 text-brand-from">
                  <Sparkles className="h-4 w-4 text-brand-from animate-pulse" />
                  Format Transcoding &amp; Conversion Pipeline
                </span>
                <span>Keyword Focus: Format Transcoding</span>
              </div>
            </div>

            <p>
              Let's explore the key file formats for modern web applications:
            </p>

            <ul className="list-disc list-inside flex flex-col gap-2 pl-4 text-xs">
              <li>
                <strong>WebP</strong>: Google's premium web standard. It offers superior, lossless and lossy compression for images. In-browser conversion converts large PNG files into lightweight WebP vectors quickly.
              </li>
              <li>
                <strong>AVIF</strong>: High-efficiency image file format with advanced tonal range, though browser-level client encoding remains compute-intensive compared to WebP.
              </li>
              <li>
                <strong>lossless PNG</strong>: Best for vector typography, user interface graphics, and assets requiring transparent backgrounds. It keeps lines perfectly crisp but maintains a large file weight.
              </li>
              <li>
                <strong>JPEG Progressive</strong>: The universal standard. Great compatibility fallback for legacy platforms, though it suffers from compression artifacts at lower quality settings.
              </li>
            </ul>
          </section>

          {/* Section 5: Legal & Ethics */}
          <section id="gdpr" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">5.</span>
              Privacy and Compliance: Operating in a GDPR-Compliant Local Sandbox
            </h2>
            
            <p>
              In an era dominated by tight copyright laws, data compliance, and user protection frameworks, web scraping can pose compliance challenges. Traditional cloud scrapers run on remote servers, caching scraped images, logging target URLs, and often violating copyright protections or telemetry frameworks.
            </p>

            <p>
              The safest design pattern is a <strong>GDPR-compliant local sandbox environment</strong>. In this architecture, all scraper computations, metadata configurations, subfolder organization structure, and image download tasks are handled entirely inside the visitor's local browser memory. No external server receives, caches, or profiles the scraped web links.
            </p>

            <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex gap-3 my-2">
              <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider font-mono">The Fair-Use Exemption</h4>
                <p className="text-[11px] leading-relaxed text-amber-600/90 dark:text-amber-500/80 mt-1 font-medium">
                  Under copyright laws, researchers, designers, and educators are granted "Fair Use" exemptions for non-commercial analysis, UI drafting, and design study purposes. However, redistributing downloaded images publicly without permission remains strictly illegal. Always make sure to check target platform licenses before reusing media!
                </p>
              </div>
            </div>

            <p>
              By leveraging modern client-side databases like IndexedDB, a bulk downloader keeps custom folders and downloaded archives locally accessible, securing high privacy and ensuring complete offline functionality.
            </p>
          </section>

          {/* Section 6: Workflow Comparison Table */}
          <section id="comparison" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">6.</span>
              Workflow Comparison: Manual vs. Basic Extractor vs. Sandbox Scraper
            </h2>

            <p>
              How does our bulk workspace compare against traditional image-gathering methods? Check out this comparison table:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm my-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">Extraction Method</th>
                    <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">Speed (100 images)</th>
                    <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">Format Transcoding</th>
                    <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">Local Organization</th>
                    <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">GDPR Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  <tr>
                    <td className="p-3.5 font-bold text-slate-850 dark:text-slate-100">Manual Save-As</td>
                    <td className="p-3.5 text-slate-500">~25 mins (Extremely Slow)</td>
                    <td className="p-3.5 text-slate-400">None (Manual convert)</td>
                    <td className="p-3.5 text-slate-400">Manual folders</td>
                    <td className="p-3.5 text-emerald-500 font-semibold">Yes (Local)</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                    <td className="p-3.5 font-bold text-slate-850 dark:text-slate-100">Chrome Extensions</td>
                    <td className="p-3.5 text-slate-500">~2 mins (Fast)</td>
                    <td className="p-3.5 text-slate-400">Basic conversion</td>
                    <td className="p-3.5 text-slate-400">Flattens file layout</td>
                    <td className="p-3.5 text-rose-500 font-semibold">Low (Adware tracker risk)</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-850 dark:text-slate-100">Cloud Web Scrapers</td>
                    <td className="p-3.5 text-slate-500">~15 seconds (Ultra Fast)</td>
                    <td className="p-3.5 text-slate-400">Server compute required</td>
                    <td className="p-3.5 text-slate-400">Cloud directories</td>
                    <td className="p-3.5 text-amber-500 font-semibold">Complex (Data logging risk)</td>
                  </tr>
                  <tr className="bg-brand/5">
                    <td className="p-3.5 font-bold text-brand">Local Sandbox Downloader</td>
                    <td className="p-3.5 text-brand font-semibold">~10 seconds (Instant)</td>
                    <td className="p-3.5 text-brand font-semibold">Advanced Canvas engine</td>
                    <td className="p-3.5 text-brand font-semibold">IndexedDB collections</td>
                    <td className="p-3.5 text-emerald-500 font-bold">100% Secure (Zero server logs)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 7: Checklist */}
          <section id="checklist" className="scroll-mt-24 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-850 pb-8">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="text-brand font-mono text-lg font-bold">7.</span>
              The Ultimate Image SEO Checklist for Batch Asset Deployment
            </h2>
            
            <p>
              Once you have retrieved a bulk set of images for your blog, news portal, or portfolio site, downloading them is only the first step. To ensure these images rank highly on search engines and do not drag down your loading performance, follow this checklist before uploading them to your Content Management System (CMS):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs my-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex gap-3">
                <ListChecks className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">1. Rename with descriptive keywords</h4>
                  <p className="text-slate-400 mt-1 leading-normal">
                    Never upload files named <code>IMG_9482.jpg</code>. Instead, rename files to reflect their content and focus keywords using hyphens (e.g., <code>bulk-image-downloader-sandbox-tutorial.webp</code>).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex gap-3">
                <ListChecks className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">2. Define highly descriptive Alt tags</h4>
                  <p className="text-slate-400 mt-1 leading-normal">
                    Search engine spiders cannot "see" image pixels. Write short, natural alt text descriptors (e.g., <code>alt="Interactive web image scraper user interface with download options"</code>) to support accessibility.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex gap-3">
                <ListChecks className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">3. Scale to maximum container widths</h4>
                  <p className="text-slate-400 mt-1 leading-normal">
                    Do not upload a 6000px raw image when the article container is only 800px wide. Pre-render files down to appropriate web resolution standards to save gigabytes of bandwidth.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex gap-3">
                <ListChecks className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">4. Inject schema.org structured markup</h4>
                  <p className="text-slate-400 mt-1 leading-normal">
                    Provide search engines with structured JSON-LD schemas indicating the image license, creator, copyright holder, and source webpage to score maximum credibility points.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Outro summary */}
          <div className="p-6 bg-linear-to-tr from-brand-from/10 to-brand-to/10 border border-brand-from/20 rounded-3xl mt-6 flex flex-col gap-4 text-center md:text-left">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
              Start Organizing Your Digital Visual Libraries Today
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              With our fully local, secure, and GDPR-compliant sandbox crawler, you can gather high-quality resources, test visual layouts, compress images into modern formats on-the-fly, and package files into structural sequence ZIPs instantly.
            </p>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="self-center md:self-start py-3 px-6 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-brand/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch the Free Scraper Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
