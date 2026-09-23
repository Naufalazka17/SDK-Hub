import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, MessageSquare, AlertCircle, RefreshCw, CheckSquare, Sparkles,
  Paperclip, X, Plus, Users, Search, Download, FileText,
  Loader2, Check, UserCheck, Trash2, Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { chatService } from '../services/chatService';
import { soundService } from '../services/soundService';
import { Conversation, Message, Profile } from '../types';
import { CreateTaskModal } from '../components/common/CreateTaskModal';

type ChatMessage = Message & { sender?: Profile | null; failed?: boolean };

export const RealtimeChatPage: React.FC = () => {
  const { currentProject, projects } = useProject();
  const { currentProfile, availableProfiles, role } = useAuth();
  const { clearUnreadChat } = useNotification();
  const { language } = useLanguage();
  const isId = language === 'id';
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState<string | null>(null);
  const [convSearch, setConvSearch] = useState('');
  const [isSoundActive, setIsSoundActive] = useState(() => soundService.isSoundEnabled());

  // Attachments
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Chat / WhatsApp-style Group Modal State
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatProjectId, setNewChatProjectId] = useState<string>('');
  const [newChatIsInternal, setNewChatIsInternal] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Chat-to-Task Bridge Modal State (#28)
  const [bridgeModalOpen, setBridgeModalOpen] = useState(false);
  const [bridgeTaskData, setBridgeTaskData] = useState<{
    title: string;
    description: string;
    messageId: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Clear unread badge on viewing chat
  useEffect(() => {
    clearUnreadChat();
  }, [clearUnreadChat, activeConversation]);

  // Load conversations & ensure default groups exist
  const loadConvs = async () => {
    try {
      // 1. Automatically ensure "Staff Only", "Project Lead & Admin", and Project channels exist
      await chatService.ensureDefaultChannels();

      const convList = await chatService.getConversations(currentProject?.id);
      
      // Filter for Client: strictly hide internal channels
      const filtered = role === 'CLIENT' 
        ? convList.filter((c) => !c.is_internal)
        : convList;

      setConversations(filtered);

      const convIdParam = searchParams.get('conv');
      const matched = filtered.find((c) => c.id === convIdParam) || filtered[0];
      if (matched && (!activeConversation || !filtered.some(c => c.id === activeConversation.id))) {
        setActiveConversation(matched);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  useEffect(() => {
    loadConvs();
  }, [currentProject, searchParams, role]);

  // Load messages and subscribe to Supabase Realtime channel
  useEffect(() => {
    if (!activeConversation) return;

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(activeConversation.id);
        setMessages(msgs);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };
    loadMessages();

    // Setup chat channel
    const channel = supabase
      .channel(`realtime:chat-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== currentProfile?.id) {
            soundService.playMessageNotificationSound();
          }
          // Only add if not already in state
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    chatChannelRef.current = channel;

    // Setup typing broadcast channel
    const typingChannel = supabase
      .channel(`broadcast:typing-${activeConversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== currentProfile?.id) {
          setPartnerTyping(payload.payload.userName);
          setTimeout(() => setPartnerTyping(null), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [activeConversation, currentProfile]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit.');
      return;
    }
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPendingPreviewUrl(url);
    } else {
      setPendingPreviewUrl(null);
    }
  };

  const removePendingFile = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !pendingFile) || !activeConversation || !currentProfile || isSending) return;

    const content = inputText.trim() || (pendingFile ? `Sent attachment: ${pendingFile.name}` : '');
    const currentPendingFile = pendingFile;
    const currentPreviewUrl = pendingPreviewUrl;

    setInputText('');
    removePendingFile();

    // Optimistic message
    let optimisticAttachments: any[] = [];
    if (currentPendingFile) {
      optimisticAttachments = [{
        name: currentPendingFile.name,
        size: currentPendingFile.size,
        type: currentPendingFile.type,
        url: currentPreviewUrl || '',
      }];
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: activeConversation.id,
      sender_id: currentProfile.id,
      content,
      created_at: new Date().toISOString(),
      sender: currentProfile,
      attachments: optimisticAttachments,
      is_pinned: false,
      is_system: false,
      reply_to_id: null,
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      setIsSending(true);
      let uploadedAttachments: any[] = [];
      if (currentPendingFile) {
        setIsUploadingAttachment(true);
        const uploaded = await chatService.uploadAttachment(currentPendingFile, activeConversation.id);
        uploadedAttachments = [uploaded];
      }

      const realMsg = await chatService.sendMessage(
        activeConversation.id,
        currentProfile.id,
        content,
        { attachments: uploadedAttachments }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...realMsg, sender: currentProfile } : m))
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message or attachment.');
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m))
      );
    } finally {
      setIsSending(false);
      setIsUploadingAttachment(false);
    }
  };

  const handleRetryMessage = async (failedMsg: ChatMessage) => {
    if (!activeConversation || !currentProfile || isSending) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, failed: false } : m))
    );

    try {
      setIsSending(true);
      const realMsg = await chatService.sendMessage(
        activeConversation.id,
        currentProfile.id,
        failedMsg.content,
        { attachments: (failedMsg.attachments as any[]) || [] }
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...realMsg, sender: currentProfile } : m))
      );
    } catch (err) {
      console.error('Retry failed:', err);
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, failed: true } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping && typingChannelRef.current && currentProfile) {
      setIsTyping(true);
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentProfile.id, userName: currentProfile.full_name },
      });
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleOpenTaskBridge = (msg: Message) => {
    setBridgeTaskData({
      title: `Client Revision: ${msg.content.slice(0, 50)}...`,
      description: `Dispatched from conversation: "${msg.content}"`,
      messageId: msg.id,
    });
    setBridgeModalOpen(true);
  };

  const handleCloseNewChatModal = () => {
    setNewChatModalOpen(false);
    setNewChatTitle('');
    setNewChatProjectId('');
    setNewChatIsInternal(true);
    setSelectedMemberIds([]);
    setMemberSearchQuery('');
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) {
      toast.error(isId ? 'Nama grup obrolan wajib diisi.' : 'Group chat name is required.');
      return;
    }

    try {
      setIsCreatingChat(true);
      const newConv = await chatService.createGroupWithMembers({
        title: newChatTitle.trim(),
        projectId: newChatProjectId || null,
        isInternal: newChatIsInternal,
        memberIds: selectedMemberIds,
        createdById: currentProfile?.id,
      });

      toast.success(isId ? `Grup "${newConv.title}" berhasil dibuat!` : `Group "${newConv.title}" created successfully!`);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      handleCloseNewChatModal();
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      toast.error(err.message || (isId ? 'Gagal membuat grup chat.' : 'Failed to create chat group.'));
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    const confirmMsg = isId
      ? `Apakah Anda yakin ingin menghapus grup chat "${conv.title}"? Semua riwayat pesan di dalamnya akan terhapus secara permanen.`
      : `Are you sure you want to delete chat group "${conv.title}"? All message history inside will be permanently deleted.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      await chatService.deleteConversation(conv.id);
      toast.success(isId ? `Grup "${conv.title}" berhasil dihapus.` : `Group "${conv.title}" deleted successfully.`);
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (activeConversation?.id === conv.id) {
        setActiveConversation(null);
      }
    } catch (err: any) {
      toast.error((isId ? 'Gagal menghapus grup chat: ' : 'Failed to delete chat group: ') + (err.message || 'Error'));
    }
  };

  // Deduplicate conversations list to ensure no duplicate titles appear
  const uniqueConversations = conversations.filter((conv, index, self) =>
    index === self.findIndex((c) =>
      c.id === conv.id ||
      (c.project_id && conv.project_id ? c.project_id === conv.project_id : c.title.trim().toLowerCase() === conv.title.trim().toLowerCase())
    )
  );

  const filteredConversations = uniqueConversations.filter((c) =>
    c.title.toLowerCase().includes(convSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col md:flex-row bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-xs overflow-hidden">
      {/* Create Task from Chat Bridge Modal */}
      {bridgeTaskData && (
        <CreateTaskModal
          isOpen={bridgeModalOpen}
          onClose={() => setBridgeModalOpen(false)}
          onTaskCreated={async () => {
            if (activeConversation) {
              await chatService.sendMessage(
                activeConversation.id,
                null,
                `Task created from client message. (Task: "${bridgeTaskData.title}", Stage: BACKLOG)`,
                { isSystem: true }
              );
            }
          }}
          initialData={{
            projectId: activeConversation?.project_id || currentProject?.id,
            title: bridgeTaskData.title,
            description: bridgeTaskData.description,
            sourceMessageId: bridgeTaskData.messageId,
            priority: 'HIGH',
            stageKey: 'BACKLOG',
          }}
        />
      )}

      {/* New Conversation / Create Group Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Buat Grup Baru' : 'Create New Group'}
                </h3>
              </div>
              <button
                onClick={handleCloseNewChatModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConversation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {isId ? 'Nama Subjek / Judul Grup' : 'Subject Name / Group Title'} <span className="text-[var(--accent-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder={isId ? 'e.g. Tim Frontend, Diskusi Proyek RSUD, Sync Leadership' : 'e.g. Frontend Team, Hospital Project Sync, Leadership'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {isId ? 'Tautkan ke Proyek (Opsional)' : 'Link to Project (Optional)'}
                  </label>
                  <select
                    value={newChatProjectId}
                    onChange={(e) => setNewChatProjectId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="">{isId ? '-- Umum / Tanpa Proyek --' : '-- General / No Project --'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} • {p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {isId ? 'Akses Grup' : 'Group Access'}
                  </label>
                  <select
                    value={newChatIsInternal ? 'INTERNAL' : 'CLIENT_FACING'}
                    onChange={(e) => setNewChatIsInternal(e.target.value === 'INTERNAL')}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="INTERNAL">{isId ? 'Internal SDK (Staff, Lead, Admin)' : 'Internal SDK (Staff, Lead, Admin)'}</option>
                    <option value="CLIENT_FACING">{isId ? 'Terbuka untuk Klien & Partner' : 'Open to Clients & Partners'}</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp-Style Member Picker */}
              <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Pilih Peserta Grup' : 'Select Group Members'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold border border-[var(--accent-border)]">
                    {isId ? `${selectedMemberIds.length} peserta dipilih` : `${selectedMemberIds.length} members selected`}
                  </span>
                </div>

                {/* Member Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder={isId ? 'Cari nama, role, atau divisi...' : 'Search name, role, or department...'}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                {/* Selected Member Chips */}
                {selectedMemberIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 py-1 max-h-20 overflow-y-auto">
                    {selectedMemberIds.map((id) => {
                      const user = availableProfiles.find((p) => p.id === id);
                      if (!user) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]"
                        >
                          <span>{user.full_name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedMemberIds((prev) => prev.filter((uid) => uid !== id))}
                            className="hover:opacity-75"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Multi-select user list */}
                <div className="max-h-44 overflow-y-auto border border-[var(--border-default)] rounded-lg divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]">
                  {availableProfiles
                    .filter((p) => p.id !== currentProfile?.id)
                    .filter((p) => {
                      if (!memberSearchQuery.trim()) return true;
                      const q = memberSearchQuery.toLowerCase();
                      return (
                        p.full_name?.toLowerCase().includes(q) ||
                        p.email?.toLowerCase().includes(q) ||
                        p.role_id?.toLowerCase().includes(q) ||
                        p.department?.toLowerCase().includes(q)
                      );
                    })
                    .map((user) => {
                      const isSelected = selectedMemberIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedMemberIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                          className={`p-2 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)] transition-colors ${
                            isSelected ? 'bg-[var(--accent-subtle)]/40 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] text-white font-bold shrink-0 border border-[var(--border-default)]">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.full_name?.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="truncate">
                              <div className="text-xs text-[var(--text-primary)] leading-none truncate">{user.full_name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                                {user.role_id} • {user.department || user.position || 'Subaga Team'}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                              isSelected
                                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                                : 'border-[var(--border-default)] bg-[var(--bg-input)]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isCreatingChat}
                  onClick={handleCloseNewChatModal}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg transition-colors"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !newChatTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isCreatingChat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isId ? 'Membuat Grup...' : 'Creating Group...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isId ? 'Buat Grup Chat' : 'Create Chat Group'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar: Conversations List */}
      <div className="w-full md:w-72 border-r border-[var(--border-default)] bg-[var(--bg-surface-subtle)] flex flex-col shrink-0">
        <div className="p-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {isId ? 'Chat & Saluran' : 'Chat & Channels'}
            </span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg flex items-center gap-1 transition-colors shadow-xs"
            title={isId ? 'Buat grup atau percakapan baru' : 'Create new group or conversation'}
          >
            <Plus className="w-3 h-3" />
            <span>{isId ? '+ Grup Baru' : '+ New Group'}</span>
          </button>
        </div>

        {/* Conversation Search Bar */}
        <div className="p-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder={isId ? 'Cari percakapan...' : 'Search conversations...'}
              className="w-full pl-7 pr-2.5 py-1 text-[11px] rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-40 text-[var(--text-muted)]" />
              <div>{isId ? 'Tidak ada percakapan ditemukan' : 'No conversations found'}</div>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="text-[11px] text-[var(--accent-primary)] hover:underline font-semibold"
              >
                {isId ? '+ Buat percakapan baru' : '+ Create one now'}
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`group relative w-full rounded-xl transition-all flex items-center gap-2.5 p-2.5 cursor-pointer ${
                  activeConversation?.id === conv.id
                    ? 'bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs font-bold text-[var(--accent-primary)]'
                    : 'hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white ${
                  conv.type === 'PROJECT_CLIENT' 
                    ? 'bg-purple-600' 
                    : conv.type === 'GROUP' 
                    ? 'bg-emerald-600' 
                    : 'bg-[var(--accent-primary)]'
                }`}>
                  {conv.type === 'PROJECT_CLIENT' ? 'C' : conv.type === 'GROUP' ? 'G' : 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate font-bold text-[var(--text-primary)]">{conv.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                    <span>
                      {conv.type === 'PROJECT_CLIENT' 
                        ? (isId ? 'Diskusi Klien' : 'Client Discussion') 
                        : conv.type === 'GROUP' 
                        ? (isId ? 'Grup Tim' : 'Team Group') 
                        : (isId ? 'Dev Internal' : 'Internal Dev')}
                    </span>
                    {conv.is_internal && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">
                        {isId ? 'Terkunci' : 'Lock'}
                      </span>
                    )}
                  </div>
                </div>
                {role !== 'CLIENT' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv);
                    }}
                    title={isId ? 'Hapus grup' : 'Delete group'}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)]">
        {/* Chat Header */}
        <div className="h-14 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <div className="truncate">
              <h2 className="text-xs font-bold text-[var(--text-primary)] truncate">
                {activeConversation?.title || (isId ? 'Pilih percakapan' : 'Select a conversation')}
              </h2>
              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                <span>{isConnected ? (isId ? 'Terhubung Realtime' : 'Realtime Connected') : (isId ? 'Menghubungkan ulang...' : 'Reconnecting...')}</span>
                {partnerTyping && (
                  <span className="text-[var(--accent-primary)] italic font-semibold">
                    • {partnerTyping} {isId ? 'sedang mengetik...' : 'is typing...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConnected && (
              <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {isId ? 'Koneksi terputus. Menghubungkan ulang...' : 'Connection lost. Reconnecting...'}
              </div>
            )}
            {/* Quick Audio Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => {
                const next = soundService.toggleSound();
                setIsSoundActive(next);
                if (next) {
                  soundService.playMessageNotificationSound();
                  toast.success(isId ? 'Suara notifikasi aktif' : 'Sound notifications enabled');
                } else {
                  toast.info(isId ? 'Suara notifikasi dibisukan' : 'Sound notifications muted');
                }
              }}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSoundActive
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)]'
              }`}
              title={isSoundActive ? (isId ? 'Suara aktif (Klik untuk membisukan)' : 'Sound enabled (Click to mute)') : (isId ? 'Suara dibisukan (Klik untuk mengaktifkan)' : 'Sound muted (Click to unmute)')}
            >
              {isSoundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSoundActive ? (isId ? 'Suara Aktif' : 'Sound On') : (isId ? 'Bisukan' : 'Muted')}</span>
            </button>
            {activeConversation && role !== 'CLIENT' && (
              <button
                type="button"
                onClick={() => handleDeleteConversation(activeConversation)}
                className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 text-xs flex items-center gap-1.5 transition-colors"
                title={isId ? 'Hapus grup chat ini' : 'Delete this chat group'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isId ? 'Hapus Grup' : 'Delete Group'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--bg-app)]">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentProfile?.id;
            const isSystem = msg.is_system;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[11px] font-semibold text-[var(--accent-primary)] flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            const attachments = (msg.attachments as any[]) || [];

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] group ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.sender?.avatar_url || '/logo.png'}
                  alt={msg.sender?.full_name || 'User'}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--border-default)]"
                />
                <div className={`space-y-1 ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <span className="font-bold text-[var(--text-primary)]">{msg.sender?.full_name || 'User'}</span>
                    <span>{new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs relative ${
                      isMe
                        ? msg.failed
                          ? 'bg-red-900 text-white rounded-tr-none border border-red-500'
                          : 'bg-[var(--accent-primary)] text-white rounded-tr-none'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none'
                    }`}
                  >
                    {msg.content && <div>{msg.content}</div>}

                    {/* Attachments rendering */}
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {attachments.map((att: any, idx: number) => {
                          const isImg = att.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/i.test(att.name || att.url || '');
                          if (isImg && att.url) {
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden border border-white/20 my-1">
                                <a href={att.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={att.url}
                                    alt={att.name || 'Attachment'}
                                    className="max-h-60 max-w-full rounded-lg object-contain hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              </div>
                            );
                          }
                          return (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={att.name}
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                                isMe
                                  ? 'bg-white/10 hover:bg-white/20 text-white'
                                  : 'bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-[var(--text-primary)]'
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0 text-sky-400" />
                              <div className="flex-1 truncate">
                                <div className="font-semibold truncate">{att.name}</div>
                                {att.size && (
                                  <div className="text-[10px] opacity-75">
                                    {(att.size / 1024).toFixed(1)} KB
                                  </div>
                                )}
                              </div>
                              <Download className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Failed Message Retry Option */}
                    {isMe && msg.failed && (
                      <div className="mt-2 pt-1.5 border-t border-red-700/50 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-red-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {isId ? 'Gagal terkirim' : 'Failed to send'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetryMessage(msg)}
                          disabled={isSending}
                          className="text-[10px] font-bold text-white bg-red-800 hover:bg-red-700 px-2 py-0.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isSending ? 'animate-spin' : ''}`} />
                          <span>{isId ? 'Coba Lagi' : 'Retry'}</span>
                        </button>
                      </div>
                    )}

                    {/* Chat -> Task Bridge Action Button */}
                    {role !== 'CLIENT' && !isMe && (
                      <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle)] flex justify-end">
                        <button
                          onClick={() => handleOpenTaskBridge(msg)}
                          className="text-[10px] font-bold text-[var(--accent-primary)] hover:underline bg-[var(--accent-subtle)] px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-[var(--accent-border)]"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>{isId ? 'Buat Tugas dari Pesan' : 'Create Task from Message'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending Attachment Preview Banner */}
        {pendingFile && (
          <div className="px-4 py-2 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-default)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {pendingPreviewUrl ? (
                <img
                  src={pendingPreviewUrl}
                  alt="Preview"
                  className="w-9 h-9 rounded-lg object-cover border border-[var(--border-default)]"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center border border-[var(--accent-border)]">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{pendingFile.name}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{(pendingFile.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>

            <button
              type="button"
              onClick={removePendingFile}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center gap-2">
          {/* File Attachment Trigger */}
          <label
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer transition-colors shrink-0"
            title={isId ? 'Lampirkan berkas atau foto' : 'Attach file or image'}
          >
            <Paperclip className="w-4 h-4" />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleSelectFile}
              className="hidden"
            />
          </label>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={
              pendingFile
                ? (isId ? 'Tambah keterangan...' : 'Add a caption...')
                : (isId ? 'Ketik pesan... (Terkirim realtime ke tim)' : 'Type a message... (Realtime broadcast to team)')
            }
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !pendingFile) || isSending}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          >
            {isUploadingAttachment ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{isId ? 'Mengunggah...' : 'Uploading...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isId ? 'Kirim' : 'Send'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
