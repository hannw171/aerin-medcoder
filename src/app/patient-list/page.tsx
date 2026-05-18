"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Patient } from "@/lib/mockData";

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' }>({
    key: 'registerNo',
    direction: 'asc'
  });

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setIsLoading(false);
      });
  }, []);

  // Filter Logic
  const filteredPatients = React.useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const lowerQ = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(lowerQ) ||
      p.rmNo.toLowerCase().includes(lowerQ) ||
      p.registerNo.toLowerCase().includes(lowerQ)
    );
  }, [patients, searchQuery]);

  // Sort Logic
  const sortedPatients = React.useMemo(() => {
    let sortableItems = [...filteredPatients];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPatients, sortConfig]);

  const requestSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Patient) => {
    if (sortConfig?.key !== key) return "unfold_more";
    return sortConfig.direction === 'asc' ? "arrow_upward" : "arrow_downward";
  };

  // Pagination Logic
  const totalItems = sortedPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = sortedPatients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Page Header & Controls */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-4">
        <div>
          <h2 className="font-display text-display text-on-background mb-1">
            Daftar Pasien Pulang
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Manage and code discharged patient records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-tight-gap">
          {/* Specific Search for Page */}
          <div className="relative bg-surface border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              style={{ fontSize: "18px" }}
            >
              search
            </span>
            <input
              className="w-full bg-transparent border-none pl-10 pr-4 py-2 font-body-md text-body-md text-on-surface focus:outline-none placeholder-on-surface-variant"
              placeholder="Search RM or Name"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
            />
          </div>
          {/* Filter Dropdown */}
          <div className="relative bg-surface border border-outline-variant rounded-lg flex items-center hover:border-primary hover:text-primary transition-colors cursor-pointer px-3 py-2">
            <span
              className="material-symbols-outlined text-on-surface-variant mr-2"
              style={{ fontSize: "18px" }}
            >
              filter_list
            </span>
            <span className="font-body-md text-body-md text-on-surface mr-2">
              Filter by DPJP
            </span>
            <span
              className="material-symbols-outlined text-on-surface-variant"
              style={{ fontSize: "18px" }}
            >
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="flex-1 bg-surface border border-outline-variant rounded-xl flex flex-col min-h-0 overflow-hidden shadow-sm">
        {/* Table Container - Scrollable Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse relative min-w-[800px]">
            {/* Header */}
            <thead className="bg-primary/10 border-b border-outline-variant sticky top-0 z-10 shadow-sm">
              <tr>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('registerNo')}
                >
                  <div className="flex items-center gap-1">
                    No. Register
                    <span className="material-symbols-outlined text-sm">{getSortIcon('registerNo')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('rmNo')}
                >
                  <div className="flex items-center gap-1">
                    No. RM
                    <span className="material-symbols-outlined text-sm">{getSortIcon('rmNo')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Nama Pasien
                    <span className="material-symbols-outlined text-sm">{getSortIcon('name')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('bpjsClass')}
                >
                  <div className="flex items-center gap-1">
                    Kelas BPJS
                    <span className="material-symbols-outlined text-sm">{getSortIcon('bpjsClass')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('dpjp')}
                >
                  <div className="flex items-center gap-1">
                    DPJP
                    <span className="material-symbols-outlined text-sm">{getSortIcon('dpjp')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('dischargeDate')}
                >
                  <div className="flex items-center gap-1">
                    Tanggal Pulang
                    <span className="material-symbols-outlined text-sm">{getSortIcon('dischargeDate')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('serviceType')}
                >
                  <div className="flex items-center gap-1">
                    Jenis Layanan
                    <span className="material-symbols-outlined text-sm">{getSortIcon('serviceType')}</span>
                  </div>
                </th>
                <th 
                  className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <span className="material-symbols-outlined text-sm">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="font-label-sm text-label-sm text-slate-600 px-4 py-4 font-bold uppercase tracking-wider bg-blue-50 text-right">
                  Action
                </th>
              </tr>
            </thead>
            {/* Body */}
            <tbody className="font-body-md text-body-md text-on-surface bg-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                      <p>Memuat data pasien...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                      <p className="font-medium text-slate-600">Tidak ada data ditemukan</p>
                      <p className="text-sm">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient, idx) => (
                  <tr
                    key={patient.id}
                    className="border-b border-slate-300 hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono-data text-mono-data text-slate-600">
                      {patient.registerNo}
                    </td>
                    <td className="px-4 py-4 font-mono-data text-mono-data text-slate-600">
                      {patient.rmNo}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{patient.name}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {patient.bpjsClass}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {patient.dpjp}
                    </td>
                    <td className="px-4 py-4 font-mono-data text-mono-data text-slate-600">
                      {patient.dischargeDate}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-xs border ${
                          patient.serviceType === "RANAP"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          patient.serviceType === "RANAP" ? "bg-teal-500" : "bg-purple-500"
                        }`} />
                        {patient.serviceType === "RANAP" ? "Rawat Inap" : "Rawat Jalan"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        id={patient.status === "Belum Coding" && idx === 0 ? "tour-patient-belum-coding" : undefined}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium text-xs border ${patient.status === "Belum Coding"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : patient.status === "Draft AI"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : patient.status === "Pending Klarifikasi"
                                ? "bg-orange-50 text-orange-700 border-orange-200 animate-pulse font-semibold"
                                : patient.status === "Direvisi"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        id={patient.status === "Belum Coding" && !patients.slice(0, idx).some(p => p.status === "Belum Coding") ? "tour-patient-first-action" : undefined}
                        href={`/coding?patientId=${patient.id}`}
                        className={`px-4 py-2 text-sm font-semibold transition-all inline-block rounded-lg ${patient.status === "Belum Coding"
                          ? "bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
                          : patient.status === "Draft AI" || patient.status === "Direvisi" || patient.status === "Pending Klarifikasi"
                            ? "border border-primary text-primary hover:bg-primary/10"
                            : "text-slate-500 hover:text-primary hover:bg-primary/5 underline"
                          }`}
                      >
                        {patient.status === "Belum Coding"
                          ? "Code Now"
                          : patient.status === "Draft AI" || patient.status === "Direvisi" || patient.status === "Pending Klarifikasi"
                            ? "Review"
                            : "View"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Footer */}
        <div className="flex-shrink-0 bg-blue-50 border-t border-outline-variant px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer shadow-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-medium text-slate-600">entri</span>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-800">{totalItems}</span> entries
            </span>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button
                className="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <div className="flex items-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, i, arr) => (
                    <React.Fragment key={page}>
                      {i > 0 && arr[i - 1] !== page - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded text-sm font-semibold transition-colors ${currentPage === page
                          ? "bg-blue-50 text-primary border border-primary/20"
                          : "text-slate-600 hover:bg-blue-50 hover:text-primary"
                          }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                className="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
