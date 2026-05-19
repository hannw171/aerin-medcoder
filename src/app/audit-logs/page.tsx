"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Patient } from "@/lib/mockDb";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        // Filter patients who are "Selesai" AND have auditOverride === true
        const auditData = (data as Patient[]).filter(p => p.status === 'Selesai' && p.auditOverride === true);
        setLogs(auditData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch patients for audit logs", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display text-[32px] font-bold text-on-surface">Log Audit Internal & Override Regulasi</h1>
          <p className="font-body-lg text-on-surface-variant">Daftar berkas klaim yang disetujui koder dengan catatan override penyulit medis khusus.</p>
        </div>
        <Link href="/patient-list" className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-xl text-sm font-semibold border border-outline-variant">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Daftar Pasien
        </Link>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col flex-1 min-h-[500px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">progress_activity</span>
            <p className="text-on-surface-variant font-medium">Memuat Log Audit...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-emerald-500 text-5xl mb-4 bg-emerald-50 p-4 rounded-full">task_alt</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Semua Sesuai Standar</h3>
            <p className="text-on-surface-variant font-medium">Tidak ada log intervensi regulasi hari ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold w-1/6">Tanggal & Waktu</th>
                  <th className="px-6 py-4 font-semibold w-1/5">No. RM / Nama Pasien</th>
                  <th className="px-6 py-4 font-semibold w-1/6">Kode Utama</th>
                  <th className="px-6 py-4 font-semibold w-1/5">Aturan yang Dilanggar</th>
                  <th className="px-6 py-4 font-semibold w-1/4">Alasan Koder (Override Note)</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  // Find the compliance alerts that were triggered
                  const triggeredAlerts = log.codingResult?.complianceAlerts?.filter(a => a.isViolated) || [];
                  const violatedRuleText = triggeredAlerts.length > 0 
                    ? triggeredAlerts.map(a => a.type).join(", ")
                    : "Potensi Temuan Medis (Tidak Diklasifikasikan)";
                  
                  return (
                    <tr 
                      key={log.id} 
                      className={`border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors ${index % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface/50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-body-md text-on-surface font-medium">{log.dischargeDate}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">Waktu Simpan Override</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-body-md text-on-surface font-bold">{log.rmNo}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">{log.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {log.codingResult?.primaryDiagnosis ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="font-mono text-sm font-bold">{log.codingResult.primaryDiagnosis.code}</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{violatedRuleText}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          "Disetujui: Ditemukan dokumen penyulit klinis sekunder di berkas fisik Rekam Medis."
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
