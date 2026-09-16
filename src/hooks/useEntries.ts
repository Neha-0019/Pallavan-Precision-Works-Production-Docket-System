import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, setDoc, updateDoc, onSnapshot,
  query, where, orderBy, Timestamp,
  type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ProductionEntry, EntryFormData, AppUser, EntryStatus, StatusTransition } from '../types';
import { generateEntryId } from '../utils/validation';
import * as calc from '../utils/calculations';

function docToEntry(id: string, data: DocumentData, hasPendingWrites: boolean): ProductionEntry {
  return {
    id,
    machineId: data.machineId,
    date: data.date,
    shift: data.shift,
    hourSlot: data.hourSlot,
    partNumber: data.partNumber,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
    plannedQty: data.plannedQty,
    producedQty: data.producedQty,
    rejectedQty: data.rejectedQty,
    rejectionReason: data.rejectionReason ?? null,
    downtimeMinutes: data.downtimeMinutes,
    downtimeReason: data.downtimeReason ?? null,
    remarks: data.remarks ?? null,
    acceptedQty: data.acceptedQty,
    rejectionPct: data.rejectionPct,
    achievementPct: data.achievementPct ?? null,
    runningTime: data.runningTime,
    status: data.status,
    statusHistory: (data.statusHistory || []).map((t: DocumentData) => ({
      status: t.status,
      actor: t.actor,
      actorName: t.actorName,
      timestamp: t.timestamp?.toDate?.() ?? new Date(),
      ...(t.remark ? { remark: t.remark } : {}),
    })),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    _hasPendingWrites: hasPendingWrites,
  };
}

function snapshotToEntries(snap: QuerySnapshot): ProductionEntry[] {
  return snap.docs.map(d =>
    docToEntry(d.id, d.data(), d.metadata.hasPendingWrites)
  );
}

function transitionToFirestore(h: StatusTransition) {
  const item: Record<string, any> = {
    status: h.status,
    actor: h.actor,
    actorName: h.actorName,
    timestamp: h.timestamp instanceof Date ? Timestamp.fromDate(h.timestamp) : h.timestamp,
  };
  if (h.remark) {
    item.remark = h.remark;
  }
  return item;
}

export function useEntries(user: AppUser | null) {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setEntries([]); setLoading(false); return; }

    let q;
    if (user.role === 'operator') {
      q = query(
        collection(db, 'entries'),
        where('operatorId', '==', user.uid),
        orderBy('date', 'desc'),
        orderBy('shift'),
      );
    } else {
      // Supervisors and managers see all
      q = query(
        collection(db, 'entries'),
        orderBy('date', 'desc'),
        orderBy('shift'),
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snapshotToEntries(snap));
      setLoading(false);
      setSyncError(null);
    }, (err) => {
      console.error('Entries listener error:', err);
      setSyncError(err.message);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const saveEntry = useCallback(async (form: EntryFormData, user: AppUser, existingEntry?: ProductionEntry) => {
    const entryId = generateEntryId(form.machineId, form.date, form.shift, form.hourSlot);
    const planned = parseInt(form.plannedQty, 10);
    const produced = parseInt(form.producedQty, 10);
    const rejected = parseInt(form.rejectedQty, 10);
    const downtime = parseInt(form.downtimeMinutes, 10);
    const accepted = calc.acceptedQty(produced, rejected);

    const now = Timestamp.now();

    const entryData = {
      machineId: form.machineId,
      date: form.date,
      shift: form.shift,
      hourSlot: form.hourSlot,
      partNumber: form.partNumber,
      operatorId: user.uid,
      operatorName: user.displayName,
      plannedQty: planned,
      producedQty: produced,
      rejectedQty: rejected,
      rejectionReason: rejected > 0 ? form.rejectionReason : null,
      downtimeMinutes: downtime,
      downtimeReason: downtime > 0 ? form.downtimeReason : null,
      remarks: form.remarks.trim() || null,
      acceptedQty: accepted,
      rejectionPct: calc.rejectionPct(produced, rejected),
      achievementPct: calc.achievementPct(planned, accepted),
      runningTime: calc.runningTime(downtime),
      status: 'draft' as EntryStatus,
      updatedAt: now,
    };

    if (existingEntry) {
      // Editing a draft or returned entry — keep history, reset to draft
      const history: StatusTransition[] = [
        ...existingEntry.statusHistory,
        { status: 'draft', actor: user.uid, actorName: user.displayName, timestamp: new Date() },
      ];
      await updateDoc(doc(db, 'entries', entryId), {
        ...entryData,
        statusHistory: history.map(transitionToFirestore),
      });
    } else {
      // New entry
      await setDoc(doc(db, 'entries', entryId), {
        ...entryData,
        statusHistory: [{
          status: 'draft',
          actor: user.uid,
          actorName: user.displayName,
          timestamp: now,
        }],
        createdAt: now,
      });
    }
  }, []);

  const submitEntry = useCallback(async (entry: ProductionEntry, user: AppUser) => {
    const now = Timestamp.now();
    await updateDoc(doc(db, 'entries', entry.id), {
      status: 'submitted',
      updatedAt: now,
      statusHistory: [
        ...entry.statusHistory.map(transitionToFirestore),
        { status: 'submitted', actor: user.uid, actorName: user.displayName, timestamp: now },
      ],
    });
  }, []);

  const approveEntry = useCallback(async (entry: ProductionEntry, user: AppUser) => {
    const now = Timestamp.now();
    await updateDoc(doc(db, 'entries', entry.id), {
      status: 'approved',
      updatedAt: now,
      statusHistory: [
        ...entry.statusHistory.map(transitionToFirestore),
        { status: 'approved', actor: user.uid, actorName: user.displayName, timestamp: now },
      ],
    });
  }, []);

  const returnEntry = useCallback(async (entry: ProductionEntry, user: AppUser, remark: string) => {
    const now = Timestamp.now();
    await updateDoc(doc(db, 'entries', entry.id), {
      status: 'returned',
      remarks: remark,
      updatedAt: now,
      statusHistory: [
        ...entry.statusHistory.map(transitionToFirestore),
        { status: 'returned', actor: user.uid, actorName: user.displayName, timestamp: now, remark },
      ],
    });
  }, []);

  return { entries, loading, syncError, saveEntry, submitEntry, approveEntry, returnEntry };
}
