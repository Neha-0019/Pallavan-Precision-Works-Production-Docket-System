import * as XLSX from 'xlsx';
import type { ProductionEntry } from '../types';

export function exportToExcel(entries: ProductionEntry[], date: string, shift: string) {
  const rows = entries.map(e => ({
    'Date': e.date,
    'Shift': e.shift,
    'Hour Slot': e.hourSlot,
    'Machine': e.machineId,
    'Part Number': e.partNumber,
    'Operator': e.operatorName,
    'Planned Qty': e.plannedQty,
    'Produced Qty': e.producedQty,
    'Rejected Qty': e.rejectedQty,
    'Accepted Qty': e.acceptedQty,
    'Rejection %': e.rejectionPct,
    'Achievement %': e.achievementPct ?? '—',
    'Rejection Reason': e.rejectionReason ?? '',
    'Downtime (min)': e.downtimeMinutes,
    'Running Time (min)': e.runningTime,
    'Downtime Reason': e.downtimeReason ?? '',
    'Remarks': e.remarks ?? '',
    'Status': e.status.charAt(0).toUpperCase() + e.status.slice(1),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns roughly
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as Record<string, unknown>)[key] ?? '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Shift ${shift} - ${date}`);
  XLSX.writeFile(wb, `PPW_Production_${date}_Shift${shift}.xlsx`);
}
