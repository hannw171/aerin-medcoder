"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Patient } from "@/lib/mockData";

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setIsLoading(false);
      });
  }, []);
  return (
    <>
      {/* Page Header & Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-2">
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
          <div className="relative bg-surface border border-outline-variant rounded-DEFAULT overflow-hidden focus-within:border-primary">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              style={{ fontSize: "18px" }}
            >
              search
            </span>
            <input
              className="w-full bg-transparent border-none pl-10 pr-4 py-2 font-body-md text-body-md text-on-surface focus:ring-0 placeholder-on-surface-variant"
              placeholder="Search RM or Name"
              type="text"
            />
          </div>
          {/* Filter Dropdown */}
          <div className="relative bg-surface border border-outline-variant rounded-DEFAULT flex items-center hover:border-primary transition-colors cursor-pointer px-3 py-2">
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
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header */}
            <thead className="bg-surface-container-lowest border-b border-outline-variant">
              <tr>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  No. Register
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  No. RM
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  Nama Pasien
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  Kelas BPJS
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  DPJP
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  Tanggal Pulang
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="font-label-sm text-label-sm text-on-surface-variant px-4 py-3 font-semibold uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            {/* Body */}
            <tbody className="font-body-md text-body-md text-on-surface bg-surface">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-outline-variant hover:bg-surface-container-low transition-colors even:bg-surface-container-lowest"
                >
                  <td className="px-4 py-3 font-mono-data text-mono-data text-on-surface-variant">
                    {patient.registerNo}
                  </td>
                  <td className="px-4 py-3 font-mono-data text-mono-data text-on-surface-variant">
                    {patient.rmNo}
                  </td>
                  <td className="px-4 py-3 font-medium">{patient.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {patient.bpjsClass}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {patient.dpjp}
                  </td>
                  <td className="px-4 py-3 font-mono-data text-mono-data text-on-surface-variant">
                    {patient.dischargeDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full font-label-sm text-label-sm border ${
                        patient.status === "Belum Coding"
                          ? "bg-error-container text-on-error-container border-transparent"
                          : patient.status === "Draft AI"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-fixed-dim/50"
                          : patient.status === "Direvisi"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/coding?patientId=${patient.id}`}
                      className={`px-3 py-1.5 font-label-sm text-label-sm transition-colors inline-block ${
                        patient.status === "Belum Coding"
                          ? "bg-primary text-on-primary rounded-DEFAULT hover:bg-primary/90"
                          : patient.status === "Draft AI" || patient.status === "Direvisi"
                          ? "border border-primary text-primary rounded-DEFAULT hover:bg-primary/10 bg-transparent"
                          : "text-on-surface-variant hover:text-primary underline decoration-outline-variant hover:decoration-primary underline-offset-4"
                      }`}
                    >
                      {patient.status === "Belum Coding"
                        ? "Code Now"
                        : patient.status === "Draft AI" || patient.status === "Direvisi"
                        ? "Review"
                        : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination / Footer simple area */}
        <div className="bg-surface-container-lowest border-t border-outline-variant p-3 flex justify-between items-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Showing 1 to 3 of 124 entries
          </span>
          <div className="flex gap-2">
            <button
              className="p-1 text-outline hover:text-on-surface disabled:opacity-50"
              disabled
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="p-1 text-on-surface hover:text-primary">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
