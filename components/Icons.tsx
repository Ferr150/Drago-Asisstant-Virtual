import React from 'react';

export const DragoCoreIcon = ({ className, status }: { className?: string; status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' }) => {
    const ringColor = status === 'listening' || status === 'processing' ? 'border-cyan-400' : 'border-violet-500';
    const coreGlow = status === 'listening' ? 'bg-cyan-400/50' : status === 'speaking' ? 'bg-violet-500/50' : status === 'processing' ? 'bg-yellow-400/50' : 'bg-slate-600/30';
    const animationSpeed = status === 'processing' ? 'animate-[spin_1s_linear_infinite]' : 'animate-[spin_4s_linear_infinite]';

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Orbital Ring */}
            <div className={`absolute w-full h-full border ${ringColor} rounded-full ${animationSpeed} transition-colors duration-500`}>
                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${ringColor.replace('border-', 'bg-')} shadow-[0_0_8px] ${ringColor.replace('border-', 'shadow-')}`}></div>
            </div>

            {/* Central Orb */}
            <div className="w-[60%] h-[60%] rounded-full bg-slate-800 border border-slate-700 shadow-inner shadow-black/50 flex items-center justify-center">
                {/* Inner Glow */}
                <div className={`w-full h-full rounded-full ${coreGlow} blur-lg transition-all duration-500`}></div>
            </div>
        </div>
    );
};

export const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);


export const MicrophoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-12 0v1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 003-3v-1.5a3 3 0 00-6 0v1.5a3 3 0 003 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v2.25m0-11.25v-1.5" />
    </svg>
);


export const StopIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3-3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
);

export const InfoIcon = ({ className }: { className?: string }) => (
     <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


export const GearIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.008 1.11-1.226.55-.218 1.192.01 1.62.458.428.448.665 1.05.576 1.646-.09.598-.564 1.068-1.114 1.284-.55.216-1.193-.008-1.622-.458a1.86 1.86 0 01-.576-1.646zM13.406 19.06c-.09.542-.56 1.008-1.11 1.226-.55.218-1.192-.01-1.62-.458a1.86 1.86 0 01-.576-1.646c.09-.598.564-1.068 1.114-1.284.55-.216 1.193.008 1.622.458.428.448.665 1.05.576 1.646zM19.06 13.406c.542.09.944.516 1.162 1.026.218.51.012 1.096-.434 1.524-.448.428-1.05.665-1.646.576-.598-.09-1.068-.564-1.284-1.114-.216-.55.008-1.193.458-1.622.448-.428 1.05-.665 1.646-.576zM4.94 9.594c.542-.09 1.008-.56 1.226-1.11.218-.55-.01-1.192-.458-1.62a1.86 1.86 0 00-1.646-.576c-.598.09-1.068.564-1.284 1.114-.216.55.008 1.193.458 1.622.448.428 1.05.665 1.646.576z" />
    </svg>
);


export const BellIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const WebSearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c-3.142 0-6 2.054-6 4.5 0 1.61.903 3.034 2.25 3.825M12 3.75c3.142 0 6 2.054 6 4.5 0 1.61-.903 3.034-2.25 3.825M2.25 12c0 2.446 2.858 4.5 6 4.5s6-2.054 6-4.5M21.75 12c0 2.446-2.858 4.5-6 4.5s-6-2.054-6-4.5" />
    </svg>
);


export const WindowMinimizeIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

export const WindowCloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CpuChipIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M15.75 21v-1.5M12 5.25v13.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 9.75h19.5v4.5h-19.5v-4.5z" />
    </svg>
);