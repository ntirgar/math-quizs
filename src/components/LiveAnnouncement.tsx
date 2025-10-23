"use client";
import React from 'react';

interface LiveAnnouncementProps {
  message: string | null;
  mode?: 'polite' | 'assertive';
}

export const LiveAnnouncement: React.FC<LiveAnnouncementProps> = ({ message, mode='polite' }) => {
  return (
    <div aria-live={mode} aria-atomic="true" style={{
      position:'absolute',
      width:1,
      height:1,
      margin:-1,
      padding:0,
      overflow:'hidden',
      clip:'rect(0 0 0 0)',
      border:0
    }}>
      {message}
    </div>
  );
};
