import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FormField, { StepTitle, bindField } from '../../components/FormField';

// Default marker icons do not load through the bundler, so point them at the CDN
L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_POSITION = [27.645835, 85.475033];
const DEFAULT_ZOOM = 8;

function LocationMarker({ position, onPick }) {
  const map = useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });

  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);

  return position ? (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  ) : null;
}

export default function MemLocation({ values, errors, touched, setFieldValue }) {
  const [address, setAddress] = useState('');
  const f = { touched, errors };
  const bind = bindField(touched, errors);

  // Same array until lat/lng actually change, so the map only moves when it should
  const position = useMemo(() => {
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    return values.lat && values.lng && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [values.lat, values.lng]);

  const pick = (lat, lng) => {
    setFieldValue('lat', lat);
    setFieldValue('lng', lng);
  };

  // Look up the address for the chosen point (waits a moment so typing does not flood the service)
  useEffect(() => {
    if (!position) { setAddress(''); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&zoom=18&addressdetails=1`
        );
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [position]);

  return (
    <section>
      <StepTitle>नक्सामा स्थान चयन गर्नुहोस्</StepTitle>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          {/* "isolate" keeps the map's layers below the fixed top bar and sidebar */}
          <div className="isolate h-72 overflow-hidden rounded-md border border-rule">
            <MapContainer
              center={position || DEFAULT_POSITION}
              zoom={position ? 15 : DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={position} onPick={pick} />
            </MapContainer>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            नोट: नक्सामा क्लिक गरेर स्थान चयन गर्नुहोस् वा बाकसमा प्रत्यक्ष रूपमा अक्षांश र देशान्तर प्रविष्ट गर्नुहोस्।
          </p>
        </div>

        <div className="space-y-4">
          <FormField label="अक्षांश (Latitude)" name="lat" {...f}>
            <input {...bind('lat')} type="text" placeholder="अक्षांश (Latitude)" value={values.lat || ''}
              onChange={(e) => setFieldValue('lat', e.target.value)} />
          </FormField>
          <FormField label="देशान्तर (Longitude)" name="lng" {...f}>
            <input {...bind('lng')} type="text" placeholder="देशान्तर (Longitude)" value={values.lng || ''}
              onChange={(e) => setFieldValue('lng', e.target.value)} />
          </FormField>
          {address && (
            <div className="rounded-md bg-paper p-3">
              <p className="label">ठेगाना (Address)</p>
              <p className="text-xs text-slate-700">{address}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
