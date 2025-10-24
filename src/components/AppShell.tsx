import React from 'react';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: React.ReactNode;
  rightOfHeader?: React.ReactNode; // optional extra controls
  hideHeader?: boolean; // when true, suppress the AppHeader (e.g., auth pages)
}

export const AppShell: React.FC<AppShellProps> = ({ children, rightOfHeader, hideHeader = false }) => {
  return (
    <div className="app-shell" style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>
      {!hideHeader && (
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:'1.25rem' }}>
          <AppHeader />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {rightOfHeader}
            {/* Theme toggle removed from global shell; now only available in Settings page */}
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
};
