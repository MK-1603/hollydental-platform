"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import PremiumBookingCTA from "@/components/public/PremiumBookingCTA";
import { Search, Calendar, ArrowRight, BookOpen, ShieldCheck, CheckCircle2, Activity, Heart, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string;
  category?: string;
  featuredImageUrl?: string;
  publishedAt?: string;
  readMinutes?: number;
}

const CATEGORY_DEFS: { key: string; label: string; desc: string; icon: any }[] = [
  { key: "all", label: "All Topics", desc: "Everything we publish", icon: BookOpen },
  {
    key: "Preventive Dentistry",
    label: "Preventive",
    desc: "Cleanings & exams",
    icon: ShieldCheck,
  },
  {
    key: "Cosmetic Dentistry",
    label: "Cosmetic",
    desc: "Veneers & bonding",
    icon: Activity,
  },
  {
    key: "Teeth Whitening",
    label: "Whitening",
    desc: "Brightening guides",
    icon: CheckCircle2,
  },
  {
    key: "Dental Implants",
    label: "Implants",
    desc: "Tooth replacement",
    icon: Activity,
  },
  {
    key: "Root Canal Treatment",
    label: "Endodontics",
    desc: "Saving teeth",
    icon: Heart,
  },
  {
    key: "Orthodontics & Braces",
    label: "Orthodontics",
    desc: "Aligners & braces",
    icon: Activity,
  },
  {
    key: "Pediatric Dentistry",
    label: "Pediatric",
    desc: "Children's care",
    icon: Heart,
  },
  {
    key: "Gum Health & Periodontal Care",
    label: "Gum health",
    desc: "Periodontal care",
    icon: ShieldCheck,
  },
  {
    key: "Emergency Dental Care",
    label: "Emergency",
    desc: "First-aid advice",
    icon: AlertCircle,
  },
  {
    key: "Smile Makeover Tips",
    label: "Makeovers",
    desc: "Restoration guides",
    icon: BookOpen,
  },
];

function normalizePosts(raw: any): BlogPost[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.posts)
    ? raw.posts
    : Array.isArray(raw?.data)
    ? raw.data
    : [];
  return list.filter(Boolean);
}

function readTime(post: BlogPost) {
  if (post.readMinutes) return post.readMinutes;
  const text = `${post.excerpt || ""} ${post.body || ""}`.trim();
  if (!text) return 3;
  const words = text.split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

export default function BlogHubPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const articlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest("/blog")
      .then((data) => setPosts(normalizePosts(data)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return posts.filter((p) => {
      const matchesSearch =
        !term ||
        p.title?.toLowerCase().includes(term) ||
        p.excerpt?.toLowerCase().includes(term);
      const matchesCategory = category === "all" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, category]);

  const featured = filteredPosts[0];
  const grid = filteredPosts.slice(1);

  const scrollToArticles = () =>
    articlesRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await apiRequest("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch {
      // graceful fallback — still confirm to the user
    }
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 6000);
  };

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,110,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,110,0.12),_transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-20 md:py-24 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest text-gold bg-white/5 border border-gold/30 px-3 py-1 rounded-full">
            <BookOpen className="w-3 h-3" /> Hollyhill Knowledge Base
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
            Dental health insights &{" "}
            <span className="text-gold italic font-medium">expert care tips</span>.
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Practical, plain-English guides on prevention, cosmetic options, family
            care, and what to expect — written by Dr. Roghay Alizadeh and the clinic
            team.
          </p>
          <div className="pt-2">
            <button
              onClick={scrollToArticles}
              className="bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-6 py-3 rounded-lg shadow-md transition-colors inline-flex items-center gap-2"
            >
              Browse latest articles <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="-mt-10 relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 md:p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mr-1">
              Browse by topic
            </span>
            {CATEGORY_DEFS.map((c) => {
              const isActive = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                    isActive
                      ? "bg-navy text-white border-navy"
                      : "border-gray-200 text-navy hover:border-gold hover:text-gold"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section
        ref={articlesRef}
        className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-24 space-y-10 scroll-mt-28"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gold">
              Updated weekly
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Latest articles &amp; dental tips
            </h2>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] shimmer rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-16 bg-off-white rounded-2xl border border-dashed border-gray-200">
            No articles match your filters yet. Try a different topic or clear the
            search.
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured */}
            {featured && <FeaturedArticle post={featured} />}

            {/* Grid */}
            {grid.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {grid.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* WHY FOLLOW */}
      <section className="bg-off-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gold">
              Patient education first
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy">
              Why follow our blog
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            <BenefitCard
              title="Expert-backed advice"
              desc="Every article is reviewed and signed off by Dr. Roghay Alizadeh."
            />
            <BenefitCard
              title="Plain-language guidance"
              desc="We translate complex clinical terms into simple, useful language."
            />
            <BenefitCard
              title="Preventive care education"
              desc="Daily habits and home routines that protect your enamel and gums."
            />
            <BenefitCard
              title="Honest treatment explanations"
              desc="Know exactly what to expect before your appointment."
            />
            <BenefitCard
              title="Family-friendly tips"
              desc="From baby teething to mature smile maintenance."
            />
            <BenefitCard
              title="Modern dental tech"
              desc="Updates on digital smile design, clear braces, and more."
            />
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-20 md:py-24">
        <div className="rounded-3xl bg-navy text-white p-8 md:p-12 text-center space-y-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,169,110,0.15),_transparent_55%)]" />

          <div className="relative space-y-5">
            <div className="w-12 h-12 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
                Stay up to date with care tips
              </h3>
              <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
                Subscribe for monthly oral health advice, treatment updates, and smile
                care recommendations from the clinic.
              </p>
            </div>

            {subscribed ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-5 py-3 rounded-xl inline-flex items-center gap-2 max-w-md mx-auto">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Thanks — you&apos;re subscribed.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold focus:bg-white/10 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-dark text-navy font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-md transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-24">
        <PremiumBookingCTA
          title="Need professional dental care?"
          description="Book an appointment with Hollyhill Dental and let our team help you maintain a healthy, confident smile."
        />
      </section>
    </div>
  );
}

/* -------------------- Cards -------------------- */

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-3xl border border-gray-100 bg-white shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 md:p-6 hover:border-gold transition-colors">
      <div className="lg:col-span-6 aspect-video rounded-2xl overflow-hidden bg-gray-100">
        {post.featuredImageUrl ? (
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              el.parentElement?.classList.add(
                "flex",
                "items-center",
                "justify-center",
                "bg-off-white"
              );
              const fallback = document.createElement("div");
              fallback.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
              el.parentElement?.appendChild(fallback);
            }}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-off-white flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gold" />
          </div>
        )}
      </div>
      <div className="lg:col-span-6 flex flex-col gap-4 justify-center">
        {post.category && (
          <span className="inline-block self-start text-[10px] uppercase font-bold tracking-widest text-gold bg-gold/10 px-2.5 py-1 rounded-full">
            {post.category}
          </span>
        )}
        <h3 className="font-serif text-2xl md:text-3xl font-bold text-navy leading-tight">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <Meta post={post} />
        <div className="pt-2">
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 bg-navy hover:bg-gray-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition-colors"
          >
            Read article <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-gold hover:shadow-card transition-all flex flex-col overflow-hidden">
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {post.featuredImageUrl ? (
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              el.parentElement?.classList.add(
                "flex",
                "items-center",
                "justify-center",
                "bg-off-white"
              );
              const fallback = document.createElement("div");
              fallback.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
              el.parentElement?.appendChild(fallback);
            }}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-off-white flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col gap-3">
        {post.category && (
          <span className="inline-block self-start text-[10px] uppercase font-bold tracking-widest text-gold">
            {post.category}
          </span>
        )}
        <h4 className="font-serif text-base md:text-lg font-semibold text-navy leading-snug line-clamp-2">
          {post.title}
        </h4>
        {post.excerpt && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <Meta post={post} compact />
          <Link
            href={`/blog/${post.slug}`}
            className="text-xs font-bold text-gold hover:text-gold-dark inline-flex items-center gap-1"
          >
            Read <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Meta({ post, compact }: { post: BlogPost; compact?: boolean }) {
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const minutes = readTime(post);

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold">
        {dateLabel && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gold" /> {dateLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-gold" /> {minutes} min
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-[11px] text-gray-400 font-semibold">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[9px] font-bold">
          RA
        </span>
        Dr. Roghay Alizadeh
      </span>
      {dateLabel && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gold" /> {dateLabel}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-gold" /> {minutes} min read
      </span>
    </div>
  );
}

function BenefitCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-gold transition-colors flex gap-4">
      <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div className="space-y-1.5">
        <h4 className="font-serif text-sm font-semibold text-navy leading-snug">
          {title}
        </h4>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
