import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users2, ShieldAlert, Clock, CheckCircle2, AlertTriangle, 
  Activity, ArrowUpRight, CheckSquare, Sparkles 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { StaffUtilization } from '../types';

export const ResourceOrchestratorPage: React.FC = () => {
  const { currentProject } = useProject();
  const { availableProfiles } = useAuth();

  const [staffList, setStaffList] = useState<StaffUtilization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateUtilization = useCallback(async () => {
    try {
      setIsLoading(true);
      const nonClients = availableProfiles.filter((p) => p.role_id !== 'CLIENT');
      if (nonClients.length === 0) {
        setStaffList([]);
        return;
      }

      // Ambil time_entries 7 hari terakhir per user
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select('user_id, duration_minutes, clock_in')
        .gte('clock_in', sevenDaysAgo)
        .not('duration_minutes', 'is', null);

      if (entriesError) {
        console.error('Error fetching time entries for utilization:', entriesError);
      }

      // Ambil task in-flight per user
      const { data: taskList, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, assignee_id, estimated_hours, actual_hours, stage_key, priority')
        .neq('stage_key', 'DONE');

      if (tasksError) {
        console.error('Error fetching tasks for utilization:', tasksError);
      }

      const utilization: StaffUtilization[] = nonClients.map((profile) => {
        const userEntries = entries?.filter((e) => e.user_id === profile.id) || [];
        const actualMinutes = userEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
        const actualHours = actualMinutes / 60;

        // Kalau actual hours 0, fallback ke estimated dari task in-flight
        const userTasks = (taskList?.filter((t) => t.assignee_id === profile.id) || []) as any[];
        const estimatedHours = userTasks.reduce(
          (sum, t) => sum + (Number(t.estimated_hours) || 0),
          0
        );
        const usedHours = actualHours > 0 ? actualHours : estimatedHours;
        const capacity = profile.max_weekly_hours || 40;
        const utilPercent = Math.min(100, Math.round((usedHours / capacity) * 100));

        return {
          profile,
          assignedTasks: userTasks,
          totalEstimatedHours: estimatedHours,
          allocatedWeeklyHours: capacity,
          utilizationPercentage: utilPercent,
          isOverloaded: utilPercent >= 90,
        };
      });

      setStaffList(utilization);
    } catch (err) {
      console.error('Failed to calculate resource utilization:', err);
    } finally {
      setIsLoading(false);
    }
  }, [availableProfiles]);

  useEffect(() => {
    calculateUtilization();

    // Realtime subscriptions to auto-refresh utilization on tasks or time_entries changes
    const taskChannel = supabase
      .channel('realtime:orchestrator-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          calculateUtilization();
        }
      )
      .subscribe();

    const timeChannel = supabase
      .channel('realtime:orchestrator-time-entries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        () => {
          calculateUtilization();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(timeChannel);
    };
  }, [calculateUtilization]);

  const overloadedStaff = staffList.filter((s) => s.isOverloaded);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 sm:p-5 rounded-xl border border-[var(--border-default)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-[var(--accent-primary)]" />
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Resource Orchestrator
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-mono">
              Realtime Telemetry
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {currentProject ? currentProject.title : 'All Projects'} • Live capacity metrics & SLA workload balancer
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border-default)]">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>{staffList.length} Active Engineers</span>
          </div>
        </div>
      </div>

      {/* Dynamic Overload Alert Notification */}
      {overloadedStaff.length > 0 ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-rose-400">
              Resource Overload Warning (&ge;90% Capacity)
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              <strong className="text-[var(--text-primary)]">{overloadedStaff.map((s) => s.profile.full_name).join(', ')}</strong>{' '}
              terdeteksi melampaui batas aman kapasitas mingguan operasional SDK (&ge;90%). 
              Disarankan melakukan re-alokasi tiket atau assignment pendukung untuk menjaga SLA pengiriman.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-emerald-400">
              All Engineering Resources Optimal
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Seluruh tim engineering beroperasi dalam ambang batas kapasitas normal (&lt;90%). Alokasi beban kerja seimbang.
            </p>
          </div>
        </div>
      )}

      {/* Staff Capacity Grid with Skeleton Loader */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-subtle)]"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 bg-[var(--bg-surface-subtle)] rounded"></div>
                  <div className="h-2 w-20 bg-[var(--bg-surface-subtle)] rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-[var(--bg-surface-subtle)] rounded-full"></div>
                <div className="h-2 w-full bg-[var(--bg-surface-subtle)] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((stf) => (
            <div
              key={stf.profile.id}
              className={`p-5 rounded-xl border bg-[var(--bg-surface)] shadow-xs space-y-4 transition-all ${
                stf.isOverloaded ? 'border-rose-500/50 ring-1 ring-rose-500/30' : 'border-[var(--border-default)]'
              }`}
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={stf.profile.avatar_url || '/logo.png'}
                    alt={stf.profile.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--border-default)]"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">{stf.profile.full_name}</h3>
                    <div className="text-[11px] text-[var(--text-secondary)]">{stf.profile.position || 'Engineer'}</div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stf.isOverloaded
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-mono'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-mono'
                }`}>
                  {stf.isOverloaded ? 'OVERLOADED' : 'OPTIMAL'}
                </span>
              </div>

              {/* Utilization Metric */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Capacity Utilization (7 Days)</span>
                  <span className={`font-extrabold font-mono ${stf.isOverloaded ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
                    {stf.utilizationPercentage}%
                  </span>
                </div>
                <div className="w-full bg-[var(--bg-surface-subtle)] h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stf.isOverloaded ? 'bg-rose-500' : 'bg-[var(--accent-primary)]'
                    }`}
                    style={{ width: `${stf.utilizationPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-0.5">
                  <span>Weekly Cap: {stf.allocatedWeeklyHours} hrs</span>
                  <span>Active Tasks: {stf.assignedTasks.length}</span>
                </div>
              </div>

              {/* In-Flight Assignments Snippet */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                  In-Flight Assignments ({stf.assignedTasks.length})
                </div>
                {stf.assignedTasks.length === 0 ? (
                  <div className="text-[11px] text-[var(--text-muted)]">No active tasks assigned</div>
                ) : (
                  stf.assignedTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="text-xs text-[var(--text-primary)] truncate flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0"></span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                        {t.estimated_hours ? `${t.estimated_hours}h` : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
