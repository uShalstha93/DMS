import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletSetup';
import { ExternalLink, Loader2, LocateFixed, Pencil, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { errorMessage } from '../api/axios';
import { membersApi } from '../api/members';

const NEPAL_CENTER = [28.3949, 84.124];
const googleMapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`; // free, no API key needed
const addressOf = (m) =>
  [m.Tole, m.MUNVDC && (m.WardNo ? `${m.MUNVDC}-${m.WardNo}` : m.MUNVDC), m.District].filter(Boolean).join(', ');
const toNumber = (text) => (String(text).trim() === '' ? NaN : Number(text));
const FILTERS = [['all', 'All'], ['set', 'With location'], ['missing', 'No location']];

// Moves the map when `focus` changes (a new member was picked, a location was saved, ...)
function FlyTo({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (!focus.id) return;
    if (focus.position) map.flyTo(focus.position, focus.zoom, { duration: 0.8 });
    else map.flyTo(NEPAL_CENTER, 7, { duration: 0.8 });
  }, [focus.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Clicking the map sets the new location, but only while editing
function ClickToPlace({ active, onPick }) {
  useMapEvents({ click: (e) => { if (active) onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// The map's size changes when the panel above it grows or shrinks
function KeepSize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function Locations() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedNo, setSelectedNo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [focus, setFocus] = useState({ id: 0, position: null, zoom: 7 });

  useEffect(() => {
    membersApi.locations()
      .then(setMembers)
      .catch((e) => setError(errorMessage(e, 'Unable to load members')))
      .finally(() => setLoading(false));
  }, []);

  const selected = members.find((m) => m.MemberNo === selectedNo) || null;
  const hasLocation = (m) => m.lat !== null;
  const fly = (position, zoom = 16) => setFocus((f) => ({ id: f.id + 1, position, zoom }));

  const withLocation = members.filter(hasLocation).length;
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return members.filter((m) => {
      if (filter === 'set' && m.lat === null) return false;
      if (filter === 'missing' && m.lat !== null) return false;
      return !t || [m.MemberNo, m.FullName, m.FullNameEng, m.MobileNo].some((v) => v?.toLowerCase().includes(t));
    });
  }, [members, term, filter]);

  // The point being placed while editing, taken from the two number boxes
  const draft = useMemo(() => {
    const lat = toNumber(latText);
    const lng = toNumber(lngText);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [latText, lngText]);

  const select = (m) => {
    setSelectedNo(m.MemberNo);
    setEditing(false);
    setMessage(null);
    fly(m.lat !== null ? [m.lat, m.lng] : null);
  };

  const startEdit = () => {
    setLatText(selected.lat !== null ? String(selected.lat) : '');
    setLngText(selected.lng !== null ? String(selected.lng) : '');
    setMessage(null);
    setEditing(true);
  };

  const pick = (lat, lng) => {
    setLatText(lat.toFixed(6));
    setLngText(lng.toFixed(6));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'This browser cannot find your location. Click on the map instead.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { pick(pos.coords.latitude, pos.coords.longitude); fly([pos.coords.latitude, pos.coords.longitude]); },
      () => setMessage({ type: 'error', text: 'Could not get your location. Allow location access in the browser, or click on the map instead.' }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async (remove = false) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await membersApi.saveLocation(selected.MemberNo, remove ? null : draft[0], remove ? null : draft[1]);
      setMembers((all) => all.map((m) => (m.MemberNo === updated.MemberNo ? { ...m, ...updated } : m)));
      setEditing(false);
      setMessage({ type: 'ok', text: remove ? 'Location removed.' : 'Location saved.' });
      fly(remove ? null : [updated.lat, updated.lng]);
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e, 'Unable to save the location') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="स्थान विवरण" subtitle="See where members live, and set or update a member's location on the map." />

      {error && <p role="alert" className="mb-4 rounded-md bg-stamp-tint px-3 py-2 text-sm text-stamp">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : (
        <div className="grid gap-4 lg:h-[calc(100vh-12rem)] lg:grid-cols-[22rem_1fr]">
          {/* Member list */}
          <aside className="panel flex max-h-80 min-h-0 flex-col overflow-hidden lg:max-h-none">
            <div className="space-y-3 border-b border-rule p-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input type="search" className="field pl-9" placeholder="नाम वा सदस्य नं." aria-label="Search members"
                  value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1" role="tablist">
                {FILTERS.map(([key, label]) => (
                  <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
                    className={`rounded-md px-2.5 py-1 text-xs ${filter === key ? 'bg-ink text-white' : 'border border-rule bg-white hover:bg-paper'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{withLocation} of {members.length} members have a location</p>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto">
              {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No members found.</li>}
              {list.map((m) => (
                <li key={m.MemberNo}>
                  <button onClick={() => select(m)}
                    className={`flex w-full items-start gap-3 border-b border-rule px-4 py-3 text-left hover:bg-paper ${m.MemberNo === selectedNo ? 'bg-ledger-tint/50' : ''}`}>
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${hasLocation(m) ? 'bg-ledger' : 'bg-slate-300'}`}
                      title={hasLocation(m) ? 'Location saved' : 'No location'} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.FullName || m.FullNameEng}</span>
                      <span className="block truncate text-xs text-slate-500">{m.MemberNo} · {addressOf(m) || 'No address'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Details + map */}
          <section className="flex min-h-0 flex-col gap-3">
            <div className="panel p-4">
              {!selected ? (
                <p className="text-sm text-slate-600">Choose a member from the list to see the location on the map.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{selected.FullName} <span className="font-normal text-slate-500">({selected.MemberNo})</span></p>
                      <p className="text-sm text-slate-600">{addressOf(selected) || 'No address saved'}</p>
                      <p className="mt-1 text-sm">
                        {selected.lat !== null ? <>Location: <span className="tabular-nums">{selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}</span></> : 'No location saved yet'}
                      </p>
                    </div>
                    {!editing && (
                      <div className="flex flex-wrap gap-2">
                        {selected.lat !== null && (
                          <a className="btn-secondary" href={googleMapsLink(selected.lat, selected.lng)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} />Open in Google Maps
                          </a>
                        )}
                        {selected.can_update && (
                          <button className="btn-primary" onClick={startEdit}>
                            <Pencil size={16} />{selected.lat !== null ? 'Update location' : 'Set location'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {message && (
                    <p role="alert" className={`mt-3 rounded-md px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ledger-tint text-ledger-dark' : 'bg-stamp-tint text-stamp'}`}>
                      {message.text}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* The map keeps its size. On large screens the edit panel floats over its top-right corner. */}
            <div className="relative lg:min-h-[380px] lg:flex-1">
              {/* "isolate" keeps the map's layers below the fixed top bar and sidebar */}
              <div className="isolate h-[420px] overflow-hidden rounded-lg border border-rule lg:h-full">
                <MapContainer center={NEPAL_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <KeepSize />
                  <FlyTo focus={focus} />
                  <ClickToPlace active={editing} onPick={pick} />

                  {!editing && selected && selected.lat !== null && (
                    <Marker position={[selected.lat, selected.lng]}>
                      <Popup>
                        <strong>{selected.FullName}</strong><br />
                        {addressOf(selected)}<br />
                        <a href={googleMapsLink(selected.lat, selected.lng)} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                      </Popup>
                    </Marker>
                  )}
                  {editing && draft && (
                    <Marker position={draft} draggable
                      eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); pick(p.lat, p.lng); } }} />
                  )}
                </MapContainer>
              </div>

              {editing && selected && (
                <div className="mt-3 rounded-lg border border-rule bg-white p-4 shadow-lg lg:absolute lg:right-3 lg:top-3 lg:z-10 lg:mt-0 lg:w-80">
                  <p className="mb-3 text-sm text-slate-600">Click on the map or drag the marker to place the location. You can also type the numbers.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="lat" className="label">अक्षांश (Lat)</label>
                      <input id="lat" className="field" inputMode="decimal" value={latText} onChange={(e) => setLatText(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="lng" className="label">देशान्तर (Lng)</label>
                      <input id="lng" className="field" inputMode="decimal" value={lngText} onChange={(e) => setLngText(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <button type="button" className="btn-secondary" onClick={useMyLocation}><LocateFixed size={16} />Use my current location</button>
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary flex-1" disabled={!draft || saving} onClick={() => save(false)}>
                        {saving && <Loader2 size={16} className="animate-spin" />}Save location
                      </button>
                      <button type="button" className="btn-secondary" disabled={saving} onClick={() => { setEditing(false); setMessage(null); }}>Cancel</button>
                    </div>
                  </div>
                  {selected.lat !== null && (
                    <button type="button" className="mt-3 text-sm font-medium text-stamp hover:underline" disabled={saving} onClick={() => save(true)}>
                      Remove location
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
