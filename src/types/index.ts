// Location types based on nauvoo_locations.json structure

export type LocationType =
  | 'Historic Site'
  | 'Visitor Amenity'
  | 'Visitors\' Center'
  | 'Monument'
  | 'Historic Temple'
  | 'Meetinghouse'
  | 'Wagon Depot';

export interface Location {
  id: number;
  name: string;
  type: LocationType;
  description: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string;
  detailUrl: string;
  hasPerformances: boolean;
}

export interface AppConfig {
  calendarUrl: string;
  googleMapsApiKey: string;
  siteName: string;
}

export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  geo?: {
    lat: number;
    lng: number;
  };
  categories?: string[];
}

export interface AdminUser {
  email: string;
}

// Pin colors mapping
export const PIN_COLORS: Record<LocationType, string> = {
  'Historic Site': '#A64B4B',
  'Visitor Amenity': '#3D5A4C',
  'Visitors\' Center': '#34495E',
  'Monument': '#5D7B93',
  'Historic Temple': '#D4A84B',
  'Meetinghouse': '#34495E',
  'Wagon Depot': '#3D5A4C',
};

// Helper to get CSS class for type badge
export const getTypeBadgeClass = (type: LocationType): string => {
  return type.toLowerCase().replace(/['\s]/g, '-');
};
