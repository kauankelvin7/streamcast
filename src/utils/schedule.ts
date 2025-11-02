import type { ScheduleItem, VideoSource } from '../types';

export function getActiveSchedule(
  schedules: ScheduleItem[], 
  playlist: VideoSource[]
): VideoSource | null {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const active = schedules.find(schedule => {
    if (!schedule.active) return false;
    if (!schedule.days.includes(currentDay)) return false;
    
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  });
  
  if (active) {
    return playlist.find(v => v.id === active.videoId) || null;
  }
  
  return null;
}

export const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
