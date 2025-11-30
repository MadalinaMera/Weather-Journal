export interface WeatherEntry {
  id: string;
  date: string; // ISO 8601 format
  temperature: number; // in Celsius
  description: string;
  photoUrl?: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface PaginatedResponse {
  entries: WeatherEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
  sys: {
    country: string;
  };
}
