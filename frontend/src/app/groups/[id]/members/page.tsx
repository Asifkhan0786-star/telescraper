'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getAuthToken } from '@/lib/api';
import { GroupMember, MemberListResponse } from '@/lib/types';
import { ArrowLeft, Download, Search, Users, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Bot, UserCheck } from 'lucide-react';

export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = decodeURIComponent((params.id as string) || '');

  const [data, setData] = useState<MemberListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 100;

  const fetchMembers = async (currentOffset: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGroupMembers(groupId, limit, currentOffset);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch members for this Telegram group.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/connect');
      return;
    }
    if (groupId) {
      fetchMembers(0);
    }
  }, [groupId, router]);

  const handleNextPage = () => {
    if (data?.has_more) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchMembers(newOffset);
    }
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      const newOffset = offset - limit;
      setOffset(newOffset);
      fetchMembers(newOffset);
    }
  };

  const handleExportCSV = () => {
    const token = getAuthToken();
    if (!token) return;
    
    const exportUrl = api.getExportUrl(groupId);
    
    // Trigger file download with Auth token in header via fetch or window download
    fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('CSV Export failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telegram_members_${groupId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        setError(err.message || 'Failed to download CSV export.');
      });
  };

  const filteredMembers = (data?.members || []).filter((m) => {
    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      (m.username && m.username.toLowerCase().includes(query)) ||
      m.id.includes(query)
    );
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-slate-800">
        <div className="space-y-2">
          <Link
            href="/groups"
            className="inline-flex items-center space-x-1.5 text-xs text-telegram-400 hover:text-telegram-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Groups</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {data?.group_title || 'Group Members'}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Group ID: {groupId} • Total accessible participants: {data?.total_count ?? '...'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchMembers(offset)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Fetch Members</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !data?.members?.length}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Table Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, username, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-telegram-500 transition-all"
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white font-mono">{offset + 1}</strong> -{' '}
            <strong className="text-white font-mono">{offset + (data?.members?.length || 0)}</strong> of{' '}
            <strong className="text-white font-mono">{data?.total_count || 0}</strong>
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevPage}
              disabled={offset === 0 || loading}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={!data?.has_more || loading}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 uppercase text-[10px] font-mono tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Member Name</th>
                <th className="py-3.5 px-6">Telegram ID</th>
                <th className="py-3.5 px-6">Username</th>
                <th className="py-3.5 px-6 text-center">Account Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    {searchQuery ? `No members found matching "${searchQuery}".` : 'No accessible member records fetched.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">
                      {member.first_name} {member.last_name}
                      {!member.first_name && !member.last_name && <span className="text-slate-500 italic">No name available</span>}
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-400">
                      {member.id}
                    </td>

                    <td className="py-4 px-6 font-mono">
                      {member.username ? (
                        <span className="text-telegram-400">@{member.username}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      {member.is_bot ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                          <Bot className="w-3 h-3" />
                          <span>Bot</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>User</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
