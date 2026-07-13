"use client";

import { useEffect, useState, useMemo } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { queueMutation } from "@/lib/offlineSync";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Plus, Search, FileText, Settings, PenTool, LayoutTemplate, 
  MoreHorizontal, Inbox, Clock, Trash2, CheckCircle2, FileEdit,
  CalendarDays, Tag, Users, Filter, Download, Upload, ArrowUpDown,
  Eye, Save, History, Image as ImageIcon, Link as LinkIcon, BarChart2,
  Sparkle, Loader2, Folder, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialog } from "@/components/DialogProvider";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function AdminBlogPage() {
  const { confirm } = useDialog();
  
  const { data: postsData, loading: postsLoading } = useLiveData<any[]>("/blog?status=all", { initialData: [] });
  const { data: categoriesData } = useLiveData<any[]>("/blog/categories", { initialData: [] });
  const { data: tagsData } = useLiveData<any[]>("/blog/tags", { initialData: [] });
  
  const posts = postsData || [];
  const categories = categoriesData || [];
  
  const [activePostId, setActivePostId] = useState<string | null>(null);
  
  const activePost = useMemo(() => posts.find(p => p.id === activePostId) || null, [posts, activePostId]);
  
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [editSlug, setEditSlug] = useState("");
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [editCanonicalUrl, setEditCanonicalUrl] = useState("");
  
  const [btnLoading, setBtnLoading] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Set active post data when it changes
  useEffect(() => {
    if (activePost && !dirty) {
      setEditTitle(activePost.title || "");
      setEditBody(activePost.body || "");
      setEditCategoryId(activePost.categoryId || "");
      setEditStatus(activePost.status || "draft");
      setEditSlug(activePost.slug || "");
      setEditSeoTitle(activePost.seoTitle || "");
      setEditSeoDescription(activePost.seoDescription || "");
      setEditCanonicalUrl(activePost.canonicalUrl || "");
      setLastSaved(new Date(activePost.updatedAt || activePost.createdAt));
    }
  }, [activePostId]);

  // Auto-save effect
  useEffect(() => {
    if (!activePost || !dirty) return;
    
    const handler = setTimeout(() => {
      handleSavePost(false);
      setDirty(false);
    }, 3000);

    return () => clearTimeout(handler);
  }, [editTitle, editBody, editCategoryId, editStatus, editSlug, editSeoTitle, editSeoDescription, editCanonicalUrl, dirty]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (activeFilter !== "all" && !activeFilter.startsWith('cat-')) {
      result = result.filter(p => p.status === activeFilter);
    }
    if (activeFilter.startsWith('cat-')) {
      const catId = activeFilter.replace('cat-', '');
      result = result.filter(p => p.categoryId === catId);
    }
    if (search) {
      result = result.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));
    }
    return result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, activeFilter, search]);

  const handleSelectPost = (post: any) => {
    if (dirty && activePostId !== post.id) {
      handleSavePost(false);
    }
    setActivePostId(post.id);
    setDirty(false);
  };

  const handleCreatePost = async () => {
    setBtnLoading(true);
    try {
      const newPost = {
        title: "Untitled Post",
        slug: "untitled-" + Date.now(),
        body: "<p>Start writing...</p>",
        status: "draft",
      };
      // For immediate creation, we call the API. If offline, this will fail and we should use queueMutation.
      // Since it's a creation that needs an ID returned to open the editor, we use apiRequest directly.
      const result = await apiRequest("/blog", {
        method: "POST",
        body: JSON.stringify(newPost),
      });

      setActivePostId(result.post.id);
      setActiveFilter("draft");
      setDirty(false);
      toast.success("New draft created.");
    } catch (error: any) {
      toast.error("Failed to create draft. Check connection.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleSavePost = async (showToast = true) => {
    if (!activePostId) return;
    if (!showToast) setIsAutosaving(true);
    else setBtnLoading(true);

    const slug = editSlug || editTitle.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const bodyPayload = {
      title: editTitle,
      slug,
      body: editBody,
      categoryId: editCategoryId || null,
      status: editStatus,
      seoTitle: editSeoTitle,
      seoDescription: editSeoDescription,
      canonicalUrl: editCanonicalUrl
    };

    try {
      // Use offline queue for updates
      await queueMutation(`/blog/${activePostId}`, "PUT", bodyPayload);
      
      setLastSaved(new Date());
      if (showToast) toast.success("Changes saved to queue.");
    } catch (error) {
      if (showToast) toast.error("Save failed.");
    } finally {
      setBtnLoading(false);
      setIsAutosaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!activePostId) return;
    const ok = await confirm({ title: "Move to Trash", description: "Are you sure you want to delete this article?", type: "danger" });
    if (!ok) return;
    try {
      await queueMutation(`/blog/${activePostId}`, "DELETE");
      setActivePostId(null);
      toast.success("Post queued for deletion.");
    } catch (error) {
      toast.error("Delete failed.");
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({ title: "Bulk Action", description: `Are you sure you want to ${action} ${selectedIds.size} articles?`, type: "danger" });
    if (!ok) return;
    
    try {
      await apiRequest("/blog/bulk", {
        method: "POST",
        body: JSON.stringify({ action, ids: Array.from(selectedIds) })
      });
      toast.success(`Articles ${action}ed.`);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(`Bulk ${action} failed.`);
    }
  };

  const handleGenerateAI = async () => {
    const topic = window.prompt("Enter a topic for the AI to write about (e.g., 'Benefits of teeth whitening'):");
    if (!topic?.trim()) return;

    setIsAILoading(true);
    try {
      const res = await apiRequest("/ai/blog-generate", {
        method: "POST",
        body: JSON.stringify({ topic, wordCount: 500 }),
      });
      if (res.article) {
        setEditBody(res.article);
        setDirty(true);
        toast.success("AI article generated!");
      }
    } catch (err: any) {
      toast.error("Failed to generate article: " + (err.message || "Unknown error"));
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col bg-white w-full max-w-none overflow-hidden font-inter">
      
      {/* ── TOP HEADER TOOLBAR ── */}
      <div className="bg-white border-b border-gray-200 shrink-0 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40 relative shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div>
            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-none mb-1">Publishing & CMS</h1>
            <p className="text-[12px] text-gray-500 font-medium">Manage articles, news, and clinic updates</p>
          </div>
          <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>
          
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-[6px]">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction('publish')} className="h-[32px] px-3 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 shadow-sm text-[12px] font-bold text-gray-700">Publish</button>
              <button onClick={() => handleBulkAction('archive')} className="h-[32px] px-3 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 shadow-sm text-[12px] font-bold text-gray-700">Archive</button>
              <button onClick={() => handleBulkAction('delete')} className="h-[32px] px-3 bg-red-50 border border-red-200 rounded-[8px] hover:bg-red-100 shadow-sm text-[12px] font-bold text-red-600">Delete</button>
              <button onClick={() => setSelectedIds(new Set())} className="h-[32px] px-2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 hidden lg:flex">
              <button className="h-[36px] px-3 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm text-gray-700 font-medium text-[13px]">
                <Filter className="w-4 h-4 text-gray-400" /> Filter
              </button>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] xl:w-[280px] pl-9 pr-4 h-[36px] bg-gray-50 border border-gray-200 rounded-[8px] text-[13px] focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" 
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCreatePost} 
            disabled={btnLoading}
            className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-[8px] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden bg-white">
        
        {/* COLUMN 1: NAVIGATION SIDEBAR (240px) */}
        <div className="hidden lg:flex w-[240px] shrink-0 border-r border-gray-200 bg-gray-50/50 flex-col overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* Status Folders */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Content Library</div>
              <div className="space-y-0.5">
                {[
                  { id: "all", label: "All Articles", icon: Inbox },
                  { id: "draft", label: "Drafts", icon: FileEdit },
                  { id: "published", label: "Published", icon: CheckCircle2 },
                  { id: "scheduled", label: "Scheduled", icon: CalendarDays },
                  { id: "archived", label: "Archived", icon: Trash2 },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveFilter(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 border border-transparent",
                      activeFilter === item.id ? "bg-white shadow-sm text-indigo-700 border-gray-200/60" : "text-gray-600 hover:bg-gray-200/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={cn("w-4 h-4", activeFilter === item.id ? "text-indigo-600" : "text-gray-400")} />
                      {item.label}
                    </div>
                    <span className={cn("text-[11px] font-semibold", activeFilter === item.id ? "text-indigo-600" : "text-gray-400")}>
                      {item.id === 'all' ? posts.length : posts.filter(p => p.status === item.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 flex justify-between items-center">
                <span>Categories</span>
                <button className="text-gray-400 hover:text-indigo-600"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-0.5">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveFilter(`cat-${cat.id}`)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 border border-transparent",
                      activeFilter === `cat-${cat.id}` ? "bg-white shadow-sm text-indigo-700 border-gray-200/60" : "text-gray-600 hover:bg-gray-200/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className={cn("w-4 h-4", activeFilter === `cat-${cat.id}` ? "text-indigo-600" : "text-gray-400")} />
                      {cat.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* COLUMN 2: ARTICLE LIST (360px) */}
        <div className={cn("w-full lg:w-[360px] shrink-0 border-r border-gray-200 bg-white flex-col relative z-10", activePostId ? "hidden lg:flex" : "flex")}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
              {activeFilter.startsWith('cat-') ? categories.find(c => c.id === activeFilter.replace('cat-', ''))?.name : activeFilter} Articles
            </h2>
            <span className="text-[12px] font-medium text-gray-500">{filteredPosts.length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {postsLoading ? (
              <div className="p-4 space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse flex flex-col gap-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900">No articles</h4>
                <p className="text-[12px] text-gray-500 mt-1">Try changing your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors flex flex-col gap-2 relative group",
                      activePostId === post.id ? "bg-indigo-50/40" : "hover:bg-gray-50"
                    )}
                  >
                    {activePostId === post.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(post.id)}
                          onClick={(e) => toggleSelection(post.id, e)}
                          className={cn(
                            "w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-opacity",
                            selectedIds.size > 0 || selectedIds.has(post.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn("text-[14px] font-bold leading-snug line-clamp-2 mb-1", activePostId === post.id ? "text-indigo-900" : "text-gray-900")}>
                          {post.title || "Untitled"}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={cn(
                            "font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border",
                            post.status === 'published' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                            post.status === 'draft' ? "bg-gray-100 text-gray-600 border-gray-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {post.status}
                          </span>
                          {post.categoryId && (
                            <span className="text-gray-400 capitalize flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              {categories.find(c => c.id === post.categoryId)?.name || "Unknown"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium pt-1 mt-1 border-t border-gray-100 ml-7">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Admin</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: EDITOR WORKSPACE */}
        <div className={cn("flex-1 bg-[#FDFDFD] flex-col relative z-0", activePostId ? "flex" : "hidden lg:flex")}>
          {activePostId && activePost ? (
            <>
              {/* Editor Toolbar */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button onClick={() => setActivePostId(null)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md shrink-0">
                    <CornerUpLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500">
                    {isAutosaving ? (
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-[1.5px] border-gray-300 border-t-indigo-500 rounded-full animate-spin" /> Saving...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved {lastSaved?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-[8px] transition-colors tooltip-trigger" title="Preview">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-[8px] transition-colors tooltip-trigger" title="Version History">
                    <History className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                  <button onClick={handleDeletePost} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors tooltip-trigger" title="Move to Trash">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isAILoading}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[13px] font-bold rounded-[8px] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 ml-2"
                  >
                    {isAILoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkle className="w-3.5 h-3.5" />}
                    <span>AI Write</span>
                  </button>
                  <button 
                    onClick={() => handleSavePost(true)}
                    disabled={btnLoading}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 ml-2"
                  >
                    {btnLoading ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save</>}
                  </button>
                </div>
              </div>

              {/* Editor Canvas */}
              <div className="flex-1 overflow-y-auto bg-[#FDFDFD] custom-scrollbar flex justify-center">
                <div className="w-full max-w-[800px] p-8 lg:p-12 flex flex-col pb-32">
                  
                  {/* Cover Image Placeholder */}
                  <div className="w-full h-[200px] bg-gray-50 border border-gray-200 border-dashed rounded-[16px] mb-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors cursor-pointer group">
                    <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[13px] font-bold">Add Cover Image</span>
                  </div>

                  {/* Title & Slug */}
                  <div className="mb-8">
                    <textarea
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        setDirty(true);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="Article Title..."
                      className="w-full text-[42px] font-extrabold text-gray-900 placeholder:text-gray-300 outline-none resize-none overflow-hidden leading-[1.1] bg-transparent tracking-tight"
                      rows={1}
                    />
                    <div className="flex items-center gap-1.5 mt-2 text-gray-400 group">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-[13px]">hollydental.com/blog/</span>
                      <input 
                        type="text" 
                        value={editSlug}
                        onChange={e => { setEditSlug(e.target.value); setDirty(true); }}
                        placeholder="article-slug"
                        className="text-[13px] bg-transparent outline-none border-b border-transparent group-hover:border-gray-300 focus:border-indigo-500 text-gray-600 w-[300px] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Metadata Settings Grid */}
                  <div className="grid grid-cols-2 gap-4 p-5 bg-white border border-gray-200 rounded-[16px] shadow-sm mb-8">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Publish Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => { setEditStatus(e.target.value); setDirty(true); }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-medium text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
                      <select
                        value={editCategoryId}
                        onChange={(e) => { setEditCategoryId(e.target.value); setDirty(true); }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-medium text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-2 pt-2 mt-2 border-t border-gray-100 grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> SEO Meta Title</label>
                        <input 
                          type="text" 
                          value={editSeoTitle}
                          onChange={e => { setEditSeoTitle(e.target.value); setDirty(true); }}
                          placeholder="Optimize title for search engines..."
                          className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Canonical URL</label>
                        <input 
                          type="text" 
                          value={editCanonicalUrl}
                          onChange={e => { setEditCanonicalUrl(e.target.value); setDirty(true); }}
                          placeholder="https://..."
                          className="w-full bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rich Text Body */}
                  <div className="flex-1 flex flex-col mt-4">
                    <RichTextEditor
                      content={editBody}
                      onChange={(html) => {
                        if (html !== editBody) {
                          setEditBody(html);
                          setDirty(true);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30 animate-in fade-in duration-300">
              <div className="w-32 h-32 relative mb-6">
                <div className="absolute inset-0 bg-indigo-100/50 rounded-full blur-xl mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-pink-100/50 rounded-full blur-xl mix-blend-multiply translate-x-4"></div>
                <div className="relative w-full h-full bg-white border border-gray-100 rounded-[24px] shadow-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
                  <LayoutTemplate className="w-12 h-12 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Select an Article</h3>
              <p className="text-[14px] text-gray-500 mt-2 max-w-sm mb-6">
                Choose an article from the list to edit, or create a new one to start writing.
              </p>
              <button 
                onClick={handleCreatePost} 
                disabled={btnLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-[10px] shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Article
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
