import { 
    formatDistanceToNow, 
    format, 
    parseISO, 
    isValid,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
  } from 'date-fns';
  
  // Date formatting
  export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(parsedDate)) return '';
      return format(parsedDate, formatStr);
    } catch {
      return '';
    }
  };
  
  export const formatDateTime = (date: string | Date): string => {
    return formatDate(date, 'MMM d, yyyy h:mm a');
  };
  
  export const formatRelativeTime = (date: string | Date): string => {
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(parsedDate)) return '';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return '';
    }
  };
  
  export const formatShortRelativeTime = (date: string | Date): string => {
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(parsedDate)) return '';
      
      const now = new Date();
      const days = differenceInDays(now, parsedDate);
      
      if (days >= 7) {
        return formatDate(parsedDate, 'MMM d');
      }
      if (days >= 1) {
        return `${days}d`;
      }
      
      const hours = differenceInHours(now, parsedDate);
      if (hours >= 1) {
        return `${hours}h`;
      }
      
      const minutes = differenceInMinutes(now, parsedDate);
      if (minutes >= 1) {
        return `${minutes}m`;
      }
      
      return 'now';
    } catch {
      return '';
    }
  };
  
  // Number formatting
  export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  export const formatCompactNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 10000) return `${(num / 1000).toFixed(1)}K`.replace('.0K', 'K');
    if (num < 1000000) return `${Math.floor(num / 1000)}K`;
    if (num < 10000000) return `${(num / 1000000).toFixed(1)}M`.replace('.0M', 'M');
    return `${Math.floor(num / 1000000)}M`;
  };
  
  export const formatCount = (count: number, singular: string, plural?: string): string => {
    const word = count === 1 ? singular : (plural || `${singular}s`);
    return `${formatCompactNumber(count)} ${word}`;
  };
  
  // File size formatting
  export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
  };
  
  // Text formatting
  export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length).trim() + suffix;
  };
  
  export const capitalizeFirst = (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  
  export const capitalizeWords = (text: string): string => {
    return text.split(' ').map(capitalizeFirst).join(' ');
  };
  
  export const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // URL formatting
  export const formatUrl = (url: string): string => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  export const ensureHttps = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };
  
  // Username formatting
  export const formatUsername = (username: string): string => {
    return `@${username.replace(/^@/, '')}`;
  };
  
  // Pluralization
  export const pluralize = (count: number, singular: string, plural?: string): string => {
    return count === 1 ? singular : (plural || `${singular}s`);
  };