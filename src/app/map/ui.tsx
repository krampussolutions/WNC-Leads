"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type Lst = {
  id: string;
  slug: string;
  business_name: string;
  category: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  account_type: string | null;
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapClient({ listings }: { listings: Lst[] }) {
  const center: [number, number] = listings.length
    ? [Number(listings[0].latitude), Number(listings[0].longitude)]
    : [35.3, -83.8]; // Western NC default

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <MapContainer center={center} zoom={9} style={{ height: 540, width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((l) => (
          <Marker key={l.id} position={[Number(l.latitude), Number(l.longitude)]} icon={icon}>
            <Popup>
              <div className="grid gap-1">
                <div className="font-semibold">{l.business_name}</div>
                <div className="text-sm">{l.category}{l.account_type ? ` · ${l.account_type}` : ""}</div>
                <div className="text-xs">{l.city}, {l.state}</div>
                <Link className="text-sm underline" href={`/listing/${l.slug}`}>View listing</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
