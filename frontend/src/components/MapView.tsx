import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView({ points }: { points: { lat: number; lng: number; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([25.5941, 85.1376], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    points.forEach((p) => L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.label));
    return () => { map.remove(); };
  }, [points]);
  return <div ref={ref} className="h-72 w-full rounded-xl border" />;
}
