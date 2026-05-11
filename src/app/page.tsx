export default function DashboardPage() {
  return (
    <>
      {/* Top Section: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Total Pasien Pulang</span>
            <span className="material-symbols-outlined text-outline">group</span>
          </div>
          <div className="font-display text-[40px] font-bold text-on-surface leading-none">124</div>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Belum Dikoding</span>
            <span className="material-symbols-outlined text-outline">pending_actions</span>
          </div>
          <div className="font-display text-[40px] font-bold text-error leading-none">32</div>
        </div>
        {/* Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-body-md text-on-surface-variant">Estimasi Klaim INA-CBG</span>
            <span className="material-symbols-outlined text-outline">payments</span>
          </div>
          <div className="font-headline-md text-[28px] font-bold text-green-700 leading-none">Rp 450.000.000</div>
        </div>
      </div>
      {/* Middle Section: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Coding Progress */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-outline-variant pb-2">Coding Progress</h2>
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="relative w-48 h-48 mb-6">
              {/* Circular Progress Background */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="10"></circle>
                {/* Circular Progress Fill */}
                <circle className="text-primary transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="283" strokeDashoffset="70.75" strokeWidth="10"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[32px] font-bold text-on-surface">75%</span>
              </div>
            </div>
            <div className="font-body-lg text-body-lg text-on-surface font-medium">Completed (92/124)</div>
            <div className="font-body-md text-body-md text-on-surface-variant mt-2 text-center max-w-sm">
              On track to finish today's quota. Keep up the good work.
            </div>
          </div>
        </div>
        {/* Right Column: Aktivitas Terkini */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">Aktivitas Terkini</h2>
            <button className="font-label-sm text-label-sm text-primary hover:underline">View All</button>
          </div>
          <div className="flex flex-col gap-0 relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-outline-variant"></div>
            {/* Row 1 */}
            <div className="flex gap-4 relative z-10 pt-2 pb-6">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px] text-primary">edit_document</span>
              </div>
              <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                <div className="font-body-md text-body-md font-medium text-on-surface">Dr. Andi - ICD generated for Patient JD-10492</div>
                <div className="font-label-sm text-label-sm text-outline mt-1">2 mins ago</div>
              </div>
            </div>
            {/* Row 2 */}
            <div className="flex gap-4 relative z-10 py-6">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px] text-green-600">check_circle</span>
              </div>
              <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                <div className="font-body-md text-body-md font-medium text-on-surface">Siti Aminah - Record validated</div>
                <div className="font-label-sm text-label-sm text-outline mt-1">15 mins ago</div>
              </div>
            </div>
            {/* Row 3 */}
            <div className="flex gap-4 relative z-10 pt-6 pb-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">rate_review</span>
              </div>
              <div className="flex-1 bg-surface rounded-lg p-3 border border-outline-variant/50">
                <div className="font-body-md text-body-md font-medium text-on-surface">Ahmad Hidayat - Review in progress</div>
                <div className="font-label-sm text-label-sm text-outline mt-1">45 mins ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
