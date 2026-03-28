import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

export function useWeather(lat: number | null, lng: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;

    setIsLoading(true);
    // Using Open-Meteo (free, no API key needed)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          const code = data.current.weather_code;
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            description: weatherCodeToDescription(code),
            icon: weatherCodeToIcon(code),
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [lat, lng]);

  return { weather, isLoading };
}

function weatherCodeToDescription(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 49) return '🌫️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '☁️';
}
