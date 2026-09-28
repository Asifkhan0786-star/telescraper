'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getAuthToken } from '@/lib/api';
import { TelegramGroup } from '@/lib/types';
import { Search, Users, Radio, ArrowRight, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'group' | 'channel'>('all');

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGroups();
      setGroups(res.groups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Telegram groups.');
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
    fetchGroups();
  }, [router]);

  const filteredGroups = groups.filter((g) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      g.title.toLowerCase().includes(query) ||
      (g.username && g.username.toLowerCase().includes(query)) ||
      g.id.includes(query);
    
    const matchesType =
      filterType === 'all' ||
      (filterType === 'channel' ? g.type === 'channel' : g.type === 'group');

    return matchesSearch && matchesType;
  });

  const groupCount = groups.filter((g) => g.type === 'group').length;
  const channelCount = groups.filter((g) => g.type === 'channel').length;

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-slate-800">
        <div>
          <span className="text-xs font-mono text-telegram-500 uppercase tracking-widest">Authorized Access</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Telegram Groups & Channels</h1>
          <p className="text-xs text-slate-400 mt-1">Select a group to inspect members and generate CSV exports.</p>
        </div>

        <button
          onClick={fetchGroups}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search groups or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-telegram-500 transition-all"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none ${
              filterType === 'all' ? 'bg-telegram-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({groups.length})
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none ${
              filterType === 'group' ? 'bg-telegram-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Groups ({groupCount})
          </button>
          <button
            onClick={() => setFilterType('channel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none ${
              filterType === 'channel' ? 'bg-telegram-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Channels ({channelCount})
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

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800"></div>
                <div className="w-16 h-5 rounded-full bg-slate-800"></div>
              </div>
              <div className="h-5 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              <div className="h-10 bg-slate-800 rounded-xl w-full pt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Groups Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {searchQuery
              ? `No Telegram chats matched "${searchQuery}".`
              : 'No accessible Telegram groups or channels were found for this account.'}
          </p>
        </div>
      ) : (
        /* Groups Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all duration-300 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-telegram-500/10 border border-telegram-500/30 text-telegram-400 flex items-center justify-center font-bold text-sm">
                    {group.type === 'channel' ? <Radio className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold uppercase tracking-wider">
                    {group.type}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base truncate group-hover:text-telegram-400 transition-colors">
                    {group.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                    {group.username ? `@${group.username}` : `ID: ${group.id}`}
                  </p>
                </div>

                {group.participants_count !== undefined && (
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-200 font-mono">{group.participants_count.toLocaleString()}</strong> participants
                  </p>
                )}
              </div>

              <Link
                href={`/groups/${encodeURIComponent(group.id)}/members`}
                className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-telegram-600 text-slate-200 hover:text-white font-medium text-xs border border-slate-800 hover:border-telegram-500 flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <span>Fetch Members</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
