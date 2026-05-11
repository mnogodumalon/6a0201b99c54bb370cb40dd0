import { useDashboardData } from '@/hooks/useDashboardData';
import type { BdbddbErfassung } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { BdbddbErfassungDialog } from '@/components/dialogs/BdbddbErfassungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconCalendar,
  IconClipboardList, IconLoader, IconCircleCheck,
  IconSearch, IconX,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';

const APPGROUP_ID = '6a0201b99c54bb370cb40dd0';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_COLUMNS = [
  { key: 'offen', label: 'Offen', icon: <IconClipboardList size={16} className="shrink-0" />, color: 'bg-amber-50 border-amber-200', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', headerClass: 'text-amber-700' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung', icon: <IconLoader size={16} className="shrink-0" />, color: 'bg-blue-50 border-blue-200', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200', headerClass: 'text-blue-700' },
  { key: 'abgeschlossen', label: 'Abgeschlossen', icon: <IconCircleCheck size={16} className="shrink-0" />, color: 'bg-green-50 border-green-200', badgeClass: 'bg-green-100 text-green-700 border-green-200', headerClass: 'text-green-700' },
] as const;

type StatusKey = typeof STATUS_COLUMNS[number]['key'];

export default function DashboardOverview() {
  const { bdbddbErfassung, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BdbddbErfassung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BdbddbErfassung | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<StatusKey | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!search.trim()) return bdbddbErfassung;
    const q = search.toLowerCase();
    return bdbddbErfassung.filter(r =>
      (r.fields.titel ?? '').toLowerCase().includes(q) ||
      (r.fields.beschreibung ?? '').toLowerCase().includes(q) ||
      (r.fields.anmerkungen ?? '').toLowerCase().includes(q)
    );
  }, [bdbddbErfassung, search]);

  const byStatus = useMemo(() => {
    const map: Record<StatusKey, BdbddbErfassung[]> = { offen: [], in_bearbeitung: [], abgeschlossen: [] };
    for (const r of filtered) {
      const key = (r.fields.status?.key ?? 'offen') as StatusKey;
      if (key in map) map[key].push(r);
      else map['offen'].push(r);
    }
    return map;
  }, [filtered]);

  const totalCount = bdbddbErfassung.length;
  const offenCount = bdbddbErfassung.filter(r => (r.fields.status?.key ?? 'offen') === 'offen').length;
  const bearbCount = bdbddbErfassung.filter(r => r.fields.status?.key === 'in_bearbeitung').length;
  const abgescCount = bdbddbErfassung.filter(r => r.fields.status?.key === 'abgeschlossen').length;

  const handleCreate = async (fields: BdbddbErfassung['fields']) => {
    await LivingAppsService.createBdbddbErfassungEntry(fields);
    fetchAll();
  };

  const handleUpdate = async (fields: BdbddbErfassung['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateBdbddbErfassungEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteBdbddbErfassungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const openCreate = (status?: StatusKey) => {
    setEditRecord(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (record: BdbddbErfassung) => {
    setEditRecord(record);
    setDefaultStatus(undefined);
    setDialogOpen(true);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const statusOpt = LOOKUP_OPTIONS['bdbddb_erfassung']?.['status'];
  const defaultStatusValue = defaultStatus
    ? statusOpt?.find(o => o.key === defaultStatus)
    : undefined;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(totalCount)}
          description="Alle Einträge"
          icon={<IconClipboardList size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(offenCount)}
          description="Ausstehend"
          icon={<IconClipboardList size={18} className="text-amber-500" />}
        />
        <StatCard
          title="In Bearbeitung"
          value={String(bearbCount)}
          description="Aktiv"
          icon={<IconLoader size={18} className="text-blue-500" />}
        />
        <StatCard
          title="Abgeschlossen"
          value={String(abgescCount)}
          description="Erledigt"
          icon={<IconCircleCheck size={18} className="text-green-500" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
        <Button onClick={() => openCreate()} size="sm" className="shrink-0">
          <IconPlus size={16} className="mr-1 shrink-0" />
          Neuer Eintrag
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map(col => {
          const cards = byStatus[col.key];
          return (
            <div key={col.key} className={`rounded-2xl border ${col.color} p-4 flex flex-col gap-3 min-h-[300px]`}>
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 font-semibold text-sm ${col.headerClass}`}>
                  {col.icon}
                  {col.label}
                  <Badge variant="outline" className={`ml-1 text-xs px-1.5 py-0 ${col.badgeClass}`}>
                    {cards.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => openCreate(col.key)}
                >
                  <IconPlus size={15} />
                </Button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {cards.length === 0 && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center py-8 gap-2 rounded-xl border-2 border-dashed border-current/20 cursor-pointer hover:border-current/40 transition-colors"
                    onClick={() => openCreate(col.key)}
                  >
                    <IconPlus size={20} className={`${col.headerClass} opacity-40`} />
                    <span className="text-xs text-muted-foreground">Eintrag hinzufügen</span>
                  </div>
                )}
                {cards.map(record => (
                  <KanbanCard
                    key={record.record_id}
                    record={record}
                    colColor={col.color}
                    onEdit={() => openEdit(record)}
                    onDelete={() => setDeleteTarget(record)}
                  />
                ))}
              </div>

              {cards.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full text-xs ${col.headerClass} hover:bg-current/5`}
                  onClick={() => openCreate(col.key)}
                >
                  <IconPlus size={14} className="mr-1" />
                  Hinzufügen
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <BdbddbErfassungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleUpdate : handleCreate}
        defaultValues={editRecord ? editRecord.fields : (defaultStatusValue ? { status: defaultStatusValue } : undefined)}
        enablePhotoScan={AI_PHOTO_SCAN['BdbddbErfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['BdbddbErfassung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`„${deleteTarget?.fields.titel ?? 'Dieser Eintrag'}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function KanbanCard({
  record,
  onEdit,
  onDelete,
}: {
  record: BdbddbErfassung;
  colColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { titel, beschreibung, datum, anmerkungen } = record.fields;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-3 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <h3 className="font-semibold text-sm leading-snug truncate min-w-0 flex-1">
          {titel || <span className="text-muted-foreground italic">Kein Titel</span>}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <IconPencil size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
            <IconTrash size={13} />
          </Button>
        </div>
      </div>

      {beschreibung && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{beschreibung}</p>
      )}

      {anmerkungen && (
        <p className="text-xs text-muted-foreground/70 italic line-clamp-1">{anmerkungen}</p>
      )}

      {datum && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <IconCalendar size={12} className="shrink-0" />
          <span>{formatDate(datum)}</span>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
