import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bike,
  Store,
  MapPin,
  MessageSquare,
  Star,
  ArrowRight,
  LogOut,
  PlusCircle,
  Radio,
  History,
  LayoutDashboard,
  UserPlus,
  Ban,
  CheckCircle2,
  XCircle,
  Navigation,
  Copy,
  Check,
  AlertTriangle,
  Bell,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ExternalLink,
  Sliders,
  RefreshCw,
  Clock,
  Phone,
  Package,
  Shield,
  Trash2,
} from 'lucide-react';

// ============================================================================
// 1. ERROR BOUNDARY (PREVENTS BLANK SCREEN ON RUNTIME ERRORS)
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao renderizar o caboondelivery.',
    };
  }

  componentDidCatch(error, info) {
    console.error('caboondelivery ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-[#0a0a0a] flex items-center justify-center p-5">
          <div className="max-w-sm w-full border border-neutral-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Falha ao carregar o caboondelivery</span>
            </div>
            <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg font-mono break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 2. CONSTANTS, SECURE HELPERS & INITIAL DATA (CABO DE SANTO AGOSTINHO, PE)
// ============================================================================
const MESSAGE_RETENTION_DAYS = 15;
const MESSAGE_RETENTION_MS = MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const DELIVERY_STATUSES = [
  'Disponível',
  'Aceita',
  'Indo buscar',
  'Pedido retirado',
  'Em deslocamento',
  'Concluída',
  'Cancelada',
  'Aguardando novo motoboy',
];

const NEXT_DRIVER_STATUS = {
  Aceita: { label: 'Indo buscar pedido', next: 'Indo buscar' },
  'Indo buscar': { label: 'Pedido retirado', next: 'Pedido retirado' },
  'Pedido retirado': { label: 'A caminho do cliente', next: 'Em deslocamento' },
  'Em deslocamento': { label: 'Concluir entrega', next: 'Concluída' },
};

// Generates a non-sequential high-entropy tracking token (e.g. CB-83921X)
function generateSecureTrackingToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(8);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i += 1) {
      buf[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  const left = Array.from(buf.slice(0, 5))
    .map((n) => chars[n % chars.length])
    .join('');
  const right = Array.from(buf.slice(5, 8))
    .map((n) => chars[n % chars.length])
    .join('');
  return `CB-${left}${right}`;
}

// Deterministic client-side credential digest helper for demo/local simulation
function digestSecret(raw) {
  const value = String(raw || '');
  try {
    return btoa(unescape(encodeURIComponent(`caboon:v1:${value}`)));
  } catch {
    return btoa(value);
  }
}

function formatCurrency(amount) {
  return `R$ ${Number(amount || 0)
    .toFixed(2)
    .replace('.', ',')}`;
}

function formatShortDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const INITIAL_SETTINGS = {
  appName: 'caboondelivery',
  regionName: 'Cabo de Santo Agostinho, PE e Região',
  supportPhone: '',
  supportEmail: '',
  googleMapsApiKey:
    (typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY__) || '',
  postCompletionRatingHours: 48,
  messageRetentionDays: MESSAGE_RETENTION_DAYS,
};

// Initial Principal Administrator account (adm@caboondelivery / caboon123) with mandatory password change on first login
const INITIAL_PRINCIPAL_ADMIN = {
  uid: 'admin-principal',
  email: 'adm@caboondelivery',
  passwordHash: digestSecret('caboon123'),
  displayName: 'Administrador Principal',
  role: 'admin',
  adminLevel: 'principal',
  permissions: {
    manageStores: true,
    manageDrivers: true,
    manageAdmins: true,
    manageDeliveries: true,
    viewRatings: true,
    manageSettings: true,
  },
  mustChangePassword: true,
  status: 'active',
  createdAt: '2026-11-01T08:00:00.000Z',
};

const INITIAL_STORES = [
  {
    storeId: 'store-01',
    ownerUid: 'store-01',
    businessName: 'Restaurante Sabor do Cabo',
    contactName: 'Marina Souza',
    phone: '(81) 98888-1111',
    email: 'restaurante@caboondelivery.com.br',
    address: 'Av. Historiador Pereira da Costa, 120 - Centro, Cabo de Santo Agostinho - PE',
    coords: { lat: -8.2869, lng: -35.0332 },
    category: 'Restaurante',
    active: true,
    createdAt: '2026-11-02T09:00:00.000Z',
  },
];

const INITIAL_DRIVERS = [
  {
    driverId: 'driver-01',
    userUid: 'driver-01',
    fullName: 'Carlos Henrique',
    phone: '(81) 98777-2222',
    email: 'carlos.moto@caboondelivery.com.br',
    notes: 'Moto 160cc • Baú térmico',
    isOnline: true,
    activeDeliveryId: null,
    ratingAvg: 4.9,
    ratingCount: 18,
    active: true,
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    driverId: 'driver-02',
    userUid: 'driver-02',
    fullName: 'Rafael Almeida',
    phone: '(81) 98666-3333',
    email: 'rafael.moto@caboondelivery.com.br',
    notes: 'Moto 150cc • Centro, Cohab e Ponte dos Carvalhos',
    isOnline: true,
    activeDeliveryId: null,
    ratingAvg: 4.8,
    ratingCount: 12,
    active: true,
    createdAt: '2026-11-02T10:15:00.000Z',
  },
];

const INITIAL_USERS = [
  INITIAL_PRINCIPAL_ADMIN,
  {
    uid: 'store-01',
    email: 'restaurante@caboondelivery.com.br',
    passwordHash: digestSecret('loja123'),
    displayName: 'Restaurante Sabor do Cabo',
    role: 'store',
    adminLevel: null,
    permissions: null,
    mustChangePassword: false,
    status: 'active',
    createdAt: '2026-11-02T09:00:00.000Z',
  },
  {
    uid: 'driver-01',
    email: 'carlos.moto@caboondelivery.com.br',
    passwordHash: digestSecret('moto123'),
    displayName: 'Carlos Henrique',
    role: 'driver',
    adminLevel: null,
    permissions: null,
    mustChangePassword: false,
    status: 'active',
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    uid: 'driver-02',
    email: 'rafael.moto@caboondelivery.com.br',
    passwordHash: digestSecret('moto123'),
    displayName: 'Rafael Almeida',
    role: 'driver',
    adminLevel: null,
    permissions: null,
    mustChangePassword: false,
    status: 'active',
    createdAt: '2026-11-02T10:15:00.000Z',
  },
];

const INITIAL_DELIVERIES = [
  {
    deliveryId: 'del-1001',
    storeId: 'store-01',
    storeName: 'Restaurante Sabor do Cabo',
    assignedDriverId: null,
    assignedDriverName: null,
    assignedDriverPhone: null,
    status: 'Disponível',
    pickupAddress: 'Av. Historiador Pereira da Costa, 120 - Centro, Cabo de Santo Agostinho - PE',
    pickupArea: 'Centro, Cabo de Santo Agostinho',
    pickupCoords: { lat: -8.2869, lng: -35.0332 },
    dropoffAddress: 'Rua Projetada 14 - Cohab, Cabo de Santo Agostinho - PE',
    dropoffArea: 'Cohab, Cabo de Santo Agostinho',
    dropoffCoords: { lat: -8.2964, lng: -35.0418 },
    customerName: 'Lucas Andrade',
    customerPhone: '(81) 99555-4444',
    orderSummary: '1 marmita e 1 refrigerante',
    notes: 'Interfone 02',
    feeAmount: 10.0,
    trackingToken: 'CB-83921X',
    trackingRevoked: false,
    trackingExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    chatId: 'chat-del-1001',
    rated: false,
    completedAt: null,
    driverLocation: null,
    createdAt: '2026-11-23T13:30:00.000Z',
    updatedAt: '2026-11-23T13:30:00.000Z',
  },
];

const INITIAL_GROUP_FEED = [
  {
    feedId: 'feed-1',
    deliveryId: 'del-1001',
    eventType: 'published',
    storeName: 'Restaurante Sabor do Cabo',
    pickupArea: 'Centro, Cabo de Santo Agostinho',
    dropoffArea: 'Cohab, Cabo de Santo Agostinho',
    orderSummary: '1 marmita e 1 refrigerante',
    feeAmount: 10.0,
    driverName: null,
    statusAfter: 'Disponível',
    description: 'Nova entrega disponível no grupo principal.',
    timestamp: '2026-11-23T13:30:00.000Z',
  },
];

const INITIAL_MESSAGES = [
  {
    messageId: 'msg-1',
    scope: 'individual',
    chatId: 'chat-del-1001',
    deliveryId: 'del-1001',
    senderRole: 'system',
    senderId: 'system',
    senderName: 'caboondelivery',
    text: 'Canal individual da entrega #1001 ativo entre cliente, loja e motoboy.',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_LOGS = [
  {
    logId: 'log-init-admin',
    adminUid: 'admin-principal',
    action: 'BOOTSTRAP_PRINCIPAL_ADMIN',
    targetType: 'user',
    targetId: 'admin-principal',
    details: 'Conta administradora principal (adm@caboondelivery) inicializada com troca obrigatória de senha no primeiro acesso.',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

// ============================================================================
// 3. OFFICIAL LOGO (caboondelivery — GREEN #16a34a / BLACK #0a0a0a / WHITE #fff)
// ============================================================================
function CaboonLogo({ size = 'md', showSubtitle = false }) {
  const iconBox = size === 'sm' ? 30 : size === 'lg' ? 44 : 36;
  const wordmarkClass =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl sm:text-[26px]' : 'text-xl';

  return (
    <div className="inline-flex flex-col items-center select-none">
      <div className="inline-flex items-center gap-2.5">
        <div
          className="flex items-center justify-center rounded-xl bg-[#16a34a] shrink-0"
          style={{ width: iconBox, height: iconBox }}
          aria-hidden="true"
        >
          <svg
            width={Math.round(iconBox * 0.62)}
            height={Math.round(iconBox * 0.62)}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 10H10M2 16H8M4 22H9"
              stroke="#0a0a0a"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M13 8L22 5L29 9.5V21.5L20 26L13 21.5V8Z"
              fill="#ffffff"
              stroke="#0a0a0a"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M13 8.5L20.5 13L29 9.5M20.5 13V25.5"
              stroke="#0a0a0a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={`font-extrabold tracking-tight lowercase text-[#0a0a0a] ${wordmarkClass}`}>
          caboon<span className="text-[#16a34a]">delivery</span>
        </span>
      </div>
      {showSubtitle && (
        <span className="text-[11px] font-medium text-neutral-500 mt-1">
          Cabo de Santo Agostinho, PE e região
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 4. REAL ADDRESS AUTOCOMPLETE INPUT (GOOGLE PLACES + NOMINATIM CABO/PE BIAS)
// ============================================================================
function AddressAutocompleteInput({
  label,
  value,
  onChange,
  onSelectAddress,
  placeholder,
  googleMapsApiKey,
  required = false,
}) {
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);

  // Attach Google Places Autocomplete when API key is configured
  useEffect(() => {
    const cleanKey = (googleMapsApiKey || '').trim();
    if (!cleanKey || !inputRef.current) return;

    const attachPlaces = () => {
      if (!window.google?.maps?.places || !inputRef.current) return;
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(-8.42, -35.16),
        new window.google.maps.LatLng(-8.18, -34.92)
      );
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        bounds,
        componentRestrictions: { country: 'br' },
        fields: ['formatted_address', 'geometry', 'name'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const addr = place?.formatted_address || place?.name || inputRef.current.value;
        const loc = place?.geometry?.location;
        onChange(addr);
        if (onSelectAddress) {
          onSelectAddress({
            address: addr,
            coords: loc
              ? { lat: loc.lat(), lng: loc.lng() }
              : { lat: -8.2869, lng: -35.0332 },
          });
        }
        setOpenDropdown(false);
      });
    };

    if (window.google?.maps?.places) {
      attachPlaces();
    } else if (!document.getElementById('google-places-script')) {
      const script = document.createElement('script');
      script.id = 'google-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        cleanKey
      )}&libraries=places`;
      script.async = true;
      script.onload = attachPlaces;
      document.head.appendChild(script);
    }
  }, [googleMapsApiKey]);

  // Real-time Nominatim lookup biased to Cabo de Santo Agostinho, PE and nearby municipalities
  useEffect(() => {
    if ((googleMapsApiKey || '').trim()) return;
    const queryText = (value || '').trim();
    if (queryText.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoadingSug(true);
    const timer = setTimeout(() => {
      const biasedQuery = queryText.toLowerCase().includes('cabo') ||
        queryText.toLowerCase().includes('pernambuco') ||
        queryText.toLowerCase().includes('pe')
        ? queryText
        : `${queryText}, Cabo de Santo Agostinho, Pernambuco, Brasil`;

      // Viewbox covering Cabo de Santo Agostinho and nearby municipalities (Jaboatão, Ipojuca, Moreno)
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=br&viewbox=-35.22,-8.48,-34.88,-8.12&bounded=0&limit=6&q=${encodeURIComponent(
          biasedQuery
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !Array.isArray(data)) return;
          const mapped = data.map((item) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.suburb || '';
            const houseNumber = addr.house_number ? `, ${addr.house_number}` : '';
            const neighborhood = addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.municipality || 'Cabo de Santo Agostinho';
            const state = addr.state_code || 'PE';
            const formatted =
              road
                ? `${road}${houseNumber}${neighborhood ? ` - ${neighborhood}` : ''}, ${city} - ${state}`
                : item.display_name;

            return {
              placeId: String(item.place_id),
              formattedAddress: formatted,
              subtext: item.display_name,
              coords: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              },
            };
          });
          setSuggestions(mapped);
          setOpenDropdown(mapped.length > 0);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingSug(false);
        });
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, googleMapsApiKey]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-semibold text-[#0a0a0a] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onFocus={() => {
            if (suggestions.length > 0) setOpenDropdown(true);
          }}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-[#0a0a0a] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15"
        />
        {loadingSug && (
          <span className="text-[10px] text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2">
            buscando...
          </span>
        )}
      </div>

      {openDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-neutral-100">
          {suggestions.map((sug) => (
            <button
              key={sug.placeId}
              type="button"
              onClick={() => {
                onChange(sug.formattedAddress);
                if (onSelectAddress) {
                  onSelectAddress({
                    address: sug.formattedAddress,
                    coords: sug.coords,
                  });
                }
                setOpenDropdown(false);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-green-50/70 transition-colors flex items-start gap-2 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0a0a0a] truncate">
                  {sug.formattedAddress}
                </p>
                <p className="text-[10px] text-neutral-500 truncate">{sug.subtext}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. REAL INTERACTIVE GEOGRAPHIC MAP (GOOGLE MAPS + OSM/OSRM ROAD ROUTING)
// ============================================================================
function UberStyleLiveMap({
  delivery,
  googleMapsApiKey,
  gpsPermissionState,
  gpsError,
  onRequestDeviceGps,
  onEtaCalculated,
  tall = false,
}) {
  const containerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletLayersRef = useRef({
    store: null,
    customer: null,
    driver: null,
    route: null,
  });
  const googleMapRef = useRef(null);
  const googleLayersRef = useRef({
    store: null,
    customer: null,
    driver: null,
    directions: null,
  });

  const [engine, setEngine] = useState('loading');
  const [mapError, setMapError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const isGoingToStore = ['Aceita', 'Indo buscar'].includes(delivery?.status);
  const isGoingToCustomer = ['Pedido retirado', 'Em deslocamento'].includes(delivery?.status);
  const isActiveDelivery = isGoingToStore || isGoingToCustomer;

  const storeCoords = delivery?.pickupCoords || { lat: -8.2869, lng: -35.0332 };
  const customerCoords = delivery?.dropoffCoords || { lat: -8.2964, lng: -35.0418 };
  const driverCoords = delivery?.driverLocation || null;

  useEffect(() => {
    let cancelled = false;

    const loadLeaflet = () =>
      new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        if (!document.getElementById('leaflet-css-link')) {
          const css = document.createElement('link');
          css.id = 'leaflet-css-link';
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(css);
        }
        const existingScript = document.getElementById('leaflet-js-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(window.L));
          existingScript.addEventListener('error', reject);
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js-script';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = () =>
          reject(new Error('Falha ao carregar os blocos do mapa geográfico.'));
        document.head.appendChild(script);
      });

    const loadGoogleMaps = (key) =>
      new Promise((resolve, reject) => {
        if (window.google?.maps) {
          resolve(window.google.maps);
          return;
        }
        const existing = document.getElementById('google-maps-sdk-script');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.google.maps));
          existing.addEventListener('error', reject);
          return;
        }
        const script = document.createElement('script');
        script.id = 'google-maps-sdk-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
          key
        )}&libraries=places,geometry`;
        script.async = true;
        script.onload = () => resolve(window.google.maps);
        script.onerror = () => reject(new Error('Chave ou carregamento do Google Maps falhou.'));
        document.head.appendChild(script);
      });

    async function bootstrapMap() {
      const apiKey = (googleMapsApiKey || '').trim();
      if (apiKey) {
        try {
          await loadGoogleMaps(apiKey);
          if (!cancelled) {
            setMapError(null);
            setEngine('google');
          }
          return;
        } catch {
          // Fallback cleanly to OpenStreetMap/Leaflet
        }
      }

      try {
        await loadLeaflet();
        if (!cancelled) {
          setMapError(null);
          setEngine('osm');
        }
      } catch (err) {
        if (!cancelled) {
          setMapError(
            err?.message ||
              'Não foi possível carregar o mapa geográfico. Verifique a conexão com a internet.'
          );
          setEngine('error');
        }
      }
    }

    bootstrapMap();
    return () => {
      cancelled = true;
    };
  }, [googleMapsApiKey]);

  // Render Leaflet + OSRM real road route
  useEffect(() => {
    if (engine !== 'osm' || !window.L || !containerRef.current) return;
    const L = window.L;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(containerRef.current, {
        center: [storeCoords.lat, storeCoords.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(leafletMapRef.current);
    }

    const map = leafletMapRef.current;
    setTimeout(() => map.invalidateSize(), 120);

    const createBadgeIcon = (bgColor, text) =>
      L.divIcon({
        className: 'caboon-pin',
        html: `<div style="background:${bgColor};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.3);padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap;transform:translate(-50%,-50%);">${text}</div>`,
        iconSize: [0, 0],
      });

    if (!leafletLayersRef.current.store) {
      leafletLayersRef.current.store = L.marker([storeCoords.lat, storeCoords.lng], {
        icon: createBadgeIcon('#0a0a0a', 'LOJA'),
      })
        .addTo(map)
        .bindPopup(`<strong>Loja:</strong> ${delivery.storeName}<br/>${delivery.pickupAddress}`);
    } else {
      leafletLayersRef.current.store.setLatLng([storeCoords.lat, storeCoords.lng]);
    }

    if (!leafletLayersRef.current.customer) {
      leafletLayersRef.current.customer = L.marker([customerCoords.lat, customerCoords.lng], {
        icon: createBadgeIcon('#16a34a', 'CLIENTE'),
      })
        .addTo(map)
        .bindPopup(
          `<strong>Destino:</strong> ${delivery.customerName}<br/>${delivery.dropoffAddress}`
        );
    } else {
      leafletLayersRef.current.customer.setLatLng([customerCoords.lat, customerCoords.lng]);
    }

    if (driverCoords) {
      if (!leafletLayersRef.current.driver) {
        leafletLayersRef.current.driver = L.marker([driverCoords.lat, driverCoords.lng], {
          icon: createBadgeIcon('#15803d', 'MOTOBOY'),
        })
          .addTo(map)
          .bindPopup(`<strong>Motoboy:</strong> ${delivery.assignedDriverName || 'Em rota'}`);
      } else {
        leafletLayersRef.current.driver.setLatLng([driverCoords.lat, driverCoords.lng]);
      }
    } else if (leafletLayersRef.current.driver) {
      leafletLayersRef.current.driver.remove();
      leafletLayersRef.current.driver = null;
    }

    let origin = storeCoords;
    let destination = customerCoords;
    let routeTarget = 'loja → cliente';

    if (driverCoords && isGoingToStore) {
      origin = driverCoords;
      destination = storeCoords;
      routeTarget = 'motoboy → loja';
    } else if (driverCoords && isGoingToCustomer) {
      origin = driverCoords;
      destination = customerCoords;
      routeTarget = 'motoboy → cliente';
    }

    let aborted = false;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((json) => {
        if (aborted || !json?.routes?.[0]) return;
        const route = json.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        if (leafletLayersRef.current.route) {
          leafletLayersRef.current.route.setLatLngs(coords);
        } else {
          leafletLayersRef.current.route = L.polyline(coords, {
            color: '#16a34a',
            weight: 5,
            opacity: 0.92,
          }).addTo(map);
        }

        map.fitBounds(L.latLngBounds(coords), { padding: [36, 36], maxZoom: 16 });

        const etaMins = Math.max(1, Math.round(route.duration / 60));
        const distKm = (route.distance / 1000).toFixed(1);
        const info = {
          durationText: `${etaMins} min`,
          distanceText: `${distKm} km`,
          routeTarget,
        };
        setRouteInfo(info);
        if (onEtaCalculated) onEtaCalculated(info);
      })
      .catch(() => {
        const pts = [
          [storeCoords.lat, storeCoords.lng],
          [customerCoords.lat, customerCoords.lng],
        ];
        if (driverCoords) pts.push([driverCoords.lat, driverCoords.lng]);
        map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 16 });
      });

    return () => {
      aborted = true;
    };
  }, [
    engine,
    delivery?.deliveryId,
    delivery?.status,
    delivery?.storeName,
    delivery?.customerName,
    delivery?.assignedDriverName,
    storeCoords.lat,
    storeCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
    driverCoords?.lat,
    driverCoords?.lng,
    isGoingToStore,
    isGoingToCustomer,
  ]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletLayersRef.current = {
          store: null,
          customer: null,
          driver: null,
          route: null,
        };
      }
    };
  }, [engine]);

  // Render Google Maps JavaScript API + Directions API when configured
  useEffect(() => {
    if (engine !== 'google' || !window.google?.maps || !containerRef.current) return;
    const g = window.google.maps;

    if (!googleMapRef.current) {
      googleMapRef.current = new g.Map(containerRef.current, {
        center: storeCoords,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    const map = googleMapRef.current;
    if (!googleLayersRef.current.directions) {
      googleLayersRef.current.directions = new g.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#16a34a',
          strokeWeight: 5,
        },
      });
    }

    if (!googleLayersRef.current.store) {
      googleLayersRef.current.store = new g.Marker({
        position: storeCoords,
        map,
        label: { text: 'LOJA', color: '#ffffff', fontWeight: 'bold', fontSize: '10px' },
      });
    } else {
      googleLayersRef.current.store.setPosition(storeCoords);
    }

    if (!googleLayersRef.current.customer) {
      googleLayersRef.current.customer = new g.Marker({
        position: customerCoords,
        map,
        label: { text: 'CLIENTE', color: '#ffffff', fontWeight: 'bold', fontSize: '10px' },
      });
    } else {
      googleLayersRef.current.customer.setPosition(customerCoords);
    }

    if (driverCoords) {
      if (!googleLayersRef.current.driver) {
        googleLayersRef.current.driver = new g.Marker({
          position: driverCoords,
          map,
          label: { text: 'MOTO', color: '#ffffff', fontWeight: 'bold', fontSize: '10px' },
        });
      } else {
        googleLayersRef.current.driver.setPosition(driverCoords);
      }
    } else if (googleLayersRef.current.driver) {
      googleLayersRef.current.driver.setMap(null);
      googleLayersRef.current.driver = null;
    }

    const origin =
      driverCoords && isActiveDelivery ? driverCoords : storeCoords;
    const destination =
      driverCoords && isGoingToStore ? storeCoords : customerCoords;
    const routeTarget =
      driverCoords && isGoingToStore
        ? 'motoboy → loja'
        : driverCoords && isGoingToCustomer
        ? 'motoboy → cliente'
        : 'loja → cliente';

    const directionsService = new g.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: g.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          googleLayersRef.current.directions.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            const info = {
              durationText: leg.duration?.text || '',
              distanceText: leg.distance?.text || '',
              routeTarget,
            };
            setRouteInfo(info);
            if (onEtaCalculated) onEtaCalculated(info);
          }
        }
      }
    );
  }, [
    engine,
    storeCoords.lat,
    storeCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
    driverCoords?.lat,
    driverCoords?.lng,
    isGoingToStore,
    isGoingToCustomer,
    isActiveDelivery,
  ]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#16a34a]" />
          <span className="text-xs font-bold text-[#0a0a0a]">
            Mapa da entrega • {delivery?.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {routeInfo && (
            <span className="px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[#15803d] text-[11px] font-bold">
              {routeInfo.durationText} ({routeInfo.distanceText})
            </span>
          )}
          <span className="text-[10px] font-medium text-neutral-400">
            {engine === 'google' ? 'Google Maps' : 'OpenStreetMap / OSRM'}
          </span>
        </div>
      </div>

      {!(googleMapsApiKey || '').trim() && (
        <div className="px-4 py-1.5 bg-neutral-50 border-b border-neutral-200 text-[11px] text-neutral-600">
          Chave do Google Maps não configurada: exibindo mapa interativo OpenStreetMap com rota viária real. Configure em <strong>Configurações & API</strong> para usar o Google Maps.
        </div>
      )}

      {(gpsError || gpsPermissionState === 'denied') && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>
              {gpsError ||
                'Localização GPS desativada ou sem permissão. Libere o GPS do dispositivo para compartilhar sua posição.'}
            </span>
          </div>
          {onRequestDeviceGps && (
            <button
              type="button"
              onClick={onRequestDeviceGps}
              className="px-2.5 py-1 rounded-md bg-red-700 text-white font-semibold text-[11px] cursor-pointer"
            >
              Ativar GPS
            </button>
          )}
        </div>
      )}

      {engine === 'error' ? (
        <div className="h-72 p-6 flex flex-col items-center justify-center text-center bg-neutral-50">
          <AlertTriangle className="w-7 h-7 text-red-600 mb-2" />
          <p className="font-bold text-sm text-[#0a0a0a]">Mapa indisponível</p>
          <p className="text-xs text-neutral-600 mt-1 max-w-md">{mapError}</p>
        </div>
      ) : (
        <div>
          <div
            ref={containerRef}
            className={`w-full ${tall ? 'h-80 sm:h-[400px]' : 'h-72'} bg-neutral-50 z-0`}
          />
          <div className="px-4 py-2 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-3 font-medium text-neutral-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0a0a0a]" /> Loja
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Cliente
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803d]" /> Motoboy{' '}
                {driverCoords
                  ? `(${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)})`
                  : '(sem GPS ativo)'}
              </span>
            </div>

            {onRequestDeviceGps && isActiveDelivery && (
              <button
                type="button"
                onClick={onRequestDeviceGps}
                className="px-3 py-1 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold cursor-pointer"
              >
                Capturar GPS agora
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. INDIVIDUAL DELIVERY CHAT COMPONENT (WITH 15-DAY AUTO-EXPIRY)
// ============================================================================
function IndividualDeliveryChat({
  chatId,
  messages,
  currentUserId,
  currentUserName,
  currentRole,
  onSendMessage,
  disabled = false,
  disabledReason = '',
}) {
  const [text, setText] = useState('');
  const chatMessages = useMemo(
    () => messages.filter((m) => m.chatId === chatId),
    [messages, chatId]
  );

  const roleLabels = {
    store: 'Lojista',
    driver: 'Motoboy',
    customer: 'Cliente',
    admin: 'Admin',
    system: 'Sistema',
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage({
      chatId,
      senderRole: currentRole,
      senderId: currentUserId,
      senderName: currentUserName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    setText('');
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 flex flex-col h-96 overflow-hidden">
      <div className="px-4 py-2.5 bg-white border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#16a34a]" />
          <span className="text-xs font-bold text-[#0a0a0a]">Chat individual da entrega</span>
        </div>
        <span className="text-[10px] text-neutral-400">Expira em 15 dias</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/70">
        {chatMessages.map((m) => {
          if (m.senderRole === 'system') {
            return (
              <div
                key={m.messageId}
                className="text-center text-[11px] text-neutral-500 bg-neutral-100 rounded-lg py-1.5 px-3"
              >
                {m.text}
              </div>
            );
          }
          const isMine = m.senderId === currentUserId;
          return (
            <div
              key={m.messageId}
              className={`flex flex-col max-w-[82%] ${
                isMine ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <span className="text-[10px] font-medium text-neutral-500 mb-0.5">
                {m.senderName} • {roleLabels[m.senderRole] || m.senderRole}
              </span>
              <div
                className={`px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                  isMine
                    ? 'bg-[#16a34a] text-white'
                    : 'bg-white text-[#0a0a0a] border border-neutral-200'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5">
                {formatShortDate(m.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {disabled ? (
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 text-center">
          {disabledReason || 'Chat indisponível.'}
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-neutral-200 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#16a34a]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2 rounded-lg bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// 7. ROOT PLATFORM SHELL (caboondelivery)
// ============================================================================
function CaboondeliveryPlatform() {
  const [view, setView] = useState('customer-entry');
  const [customerToken, setCustomerToken] = useState('');

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [stores, setStores] = useState(INITIAL_STORES);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [groupFeed, setGroupFeed] = useState(INITIAL_GROUP_FEED);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [ratings, setRatings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminLogs, setAdminLogs] = useState(INITIAL_LOGS);

  const [currentUser, setCurrentUser] = useState(null);
  const [banner, setBanner] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsPermissionState, setGpsPermissionState] = useState('prompt');

  const notifyBanner = (msg, type = 'info') => {
    setBanner({ msg, type });
  };

  const pushNotification = (recipientUid, title, body, deliveryId = null) => {
    setNotifications((prev) => [
      {
        notificationId: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recipientUid,
        title,
        body,
        deliveryId,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const pushGroupFeedEvent = (entry) => {
    setGroupFeed((prev) => [
      {
        feedId: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ]);
  };

  const pushAdminLog = (action, targetType, targetId, details) => {
    setAdminLogs((prev) => [
      {
        logId: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        adminUid: currentUser?.uid || 'admin-principal',
        action,
        targetType,
        targetId,
        details,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Automatic 15-day retention cleanup for messages (preserving deliveries, fees, ratings & history)
  const runMessageRetentionCleanup = () => {
    const retentionMs = (settings.messageRetentionDays || MESSAGE_RETENTION_DAYS) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    setMessages((prev) =>
      prev.filter((msg) => {
        const ts = new Date(msg.createdAt).getTime();
        return Number.isNaN(ts) || ts >= cutoff;
      })
    );
  };

  useEffect(() => {
    runMessageRetentionCleanup();
    const interval = setInterval(runMessageRetentionCleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.messageRetentionDays]);

  const hasPrincipalAdmin = useMemo(
    () => users.some((u) => u.role === 'admin' && u.adminLevel === 'principal'),
    [users]
  );

  // Bootstrap initial principal admin account once if removed/uninitialized
  const handleBootstrapPrincipalAdmin = ({ email, password, displayName }) => {
    if (hasPrincipalAdmin) {
      notifyBanner('A conta administradora principal já existe no sistema.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const adminAcc = {
      uid: `admin-principal-${Date.now().toString().slice(-5)}`,
      email: email.trim().toLowerCase(),
      passwordHash: digestSecret(password),
      displayName: displayName.trim() || 'Administrador Principal',
      role: 'admin',
      adminLevel: 'principal',
      permissions: {
        manageStores: true,
        manageDrivers: true,
        manageAdmins: true,
        manageDeliveries: true,
        viewRatings: true,
        manageSettings: true,
      },
      mustChangePassword: true,
      status: 'active',
      createdAt: now,
    };
    setUsers((prev) => [adminAcc, ...prev]);
    setCurrentUser(adminAcc);
    pushAdminLog(
      'BOOTSTRAP_PRINCIPAL_ADMIN',
      'user',
      adminAcc.uid,
      `Administrador principal (${adminAcc.email}) criado.`
    );
    notifyBanner('Conta administradora principal criada. Defina sua nova senha.', 'success');
    setView('admin');
  };

  const handleCompletePasswordChange = (newPassword) => {
    if (!currentUser) return;
    const nextHash = digestSecret(newPassword);
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === currentUser.uid
          ? { ...u, passwordHash: nextHash, mustChangePassword: false }
          : u
      )
    );
    setCurrentUser((prev) =>
      prev ? { ...prev, passwordHash: nextHash, mustChangePassword: false } : null
    );
    pushAdminLog(
      'FIRST_LOGIN_PASSWORD_CHANGED',
      'user',
      currentUser.uid,
      'Senha inicial alterada com sucesso no primeiro acesso.'
    );
    notifyBanner('Senha alterada com sucesso!', 'success');
  };

  const handleStaffLogin = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!account) {
      notifyBanner(
        'Conta não encontrada. Somente o administrador pode cadastrar usuários.',
        'error'
      );
      return;
    }
    if (account.status === 'blocked') {
      notifyBanner('Esta conta está bloqueada pela administração.', 'error');
      return;
    }
    if (account.status === 'inactive') {
      notifyBanner('Esta conta está desativada.', 'error');
      return;
    }
    if (account.passwordHash && account.passwordHash !== digestSecret(password)) {
      notifyBanner('E-mail ou senha inválidos.', 'error');
      return;
    }

    setCurrentUser(account);
    if (account.mustChangePassword) {
      notifyBanner(
        'Primeiro acesso detectado: altere sua senha inicial para continuar.',
        'info'
      );
    } else {
      notifyBanner(`Bem-vindo(a) de volta, ${account.displayName}!`, 'success');
    }

    if (account.role === 'admin') setView('admin');
    else if (account.role === 'store') setView('store');
    else if (account.role === 'driver') setView('driver');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('customer-entry');
  };

  // Validate customer token before opening tracking screen
  const handleCustomerTokenAccess = (rawToken) => {
    const clean = (rawToken || '').trim().toUpperCase();
    if (!clean) {
      return { ok: false, message: 'Informe o código TOKEN fornecido pela loja.' };
    }

    const match = deliveries.find((d) => d.trackingToken.toUpperCase() === clean);
    if (!match) {
      return {
        ok: false,
        message: 'Código não encontrado. Verifique o TOKEN com o estabelecimento.',
      };
    }

    if (match.trackingRevoked) {
      return {
        ok: false,
        message: 'Este código de acompanhamento foi revogado.',
      };
    }

    if (match.status === 'Cancelada') {
      return {
        ok: false,
        message: 'Esta entrega foi cancelada.',
      };
    }

    if (match.trackingExpiresAt && new Date(match.trackingExpiresAt).getTime() < Date.now()) {
      return {
        ok: false,
        message: 'O prazo de acompanhamento deste código expirou.',
      };
    }

    if (match.status === 'Concluída' && match.completedAt) {
      const hoursSinceCompletion =
        (Date.now() - new Date(match.completedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCompletion > (settings.postCompletionRatingHours || 48)) {
        return {
          ok: false,
          message: 'O período de acompanhamento e avaliação desta entrega já encerrou.',
        };
      }
    }

    setCustomerToken(match.trackingToken);
    setView('tracking');
    return { ok: true };
  };

  const handlePublishDelivery = async (payload) => {
    const storeRecord = stores.find((s) => s.storeId === currentUser.uid) || {
      storeId: currentUser.uid,
      businessName: currentUser.displayName,
      address: payload.pickupAddress,
      coords: { lat: -8.2869, lng: -35.0332 },
    };

    const now = new Date().toISOString();
    const deliveryId = `del-${Date.now().toString().slice(-5)}`;
    const token = generateSecureTrackingToken();

    let pickupCoords = payload.pickupCoords || storeRecord.coords || { lat: -8.2869, lng: -35.0332 };
    let dropoffCoords = payload.dropoffCoords || { lat: -8.2964, lng: -35.0418 };

    if (!payload.dropoffCoords && payload.dropoffAddress) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            payload.dropoffAddress
          )}`
        );
        const list = await res.json();
        if (list?.[0]) {
          dropoffCoords = {
            lat: parseFloat(list[0].lat),
            lng: parseFloat(list[0].lon),
          };
        }
      } catch {
        // Keeps resolved fallback
      }
    }

    const pickupArea =
      payload.pickupAddress.split('-').slice(-2)[0]?.trim() || 'Cabo de Santo Agostinho';
    const dropoffArea =
      payload.dropoffAddress.split('-').slice(-2)[0]?.trim() || 'Cabo de Santo Agostinho';

    const newDelivery = {
      deliveryId,
      storeId: storeRecord.storeId,
      storeName: storeRecord.businessName,
      assignedDriverId: null,
      assignedDriverName: null,
      assignedDriverPhone: null,
      status: 'Disponível',
      pickupAddress: payload.pickupAddress,
      pickupArea,
      pickupCoords,
      dropoffAddress: payload.dropoffAddress,
      dropoffArea,
      dropoffCoords,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      orderSummary: payload.orderSummary,
      notes: payload.notes || '',
      feeAmount: Number(payload.feeAmount),
      trackingToken: token,
      trackingRevoked: false,
      trackingExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      chatId: `chat-${deliveryId}`,
      rated: false,
      completedAt: null,
      driverLocation: null,
      createdAt: now,
      updatedAt: now,
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    pushGroupFeedEvent({
      deliveryId,
      eventType: 'published',
      storeName: storeRecord.businessName,
      pickupArea,
      dropoffArea,
      orderSummary: payload.orderSummary,
      feeAmount: Number(payload.feeAmount),
      driverName: null,
      statusAfter: 'Disponível',
      description: `Nova entrega publicada por ${storeRecord.businessName}.`,
    });

    setMessages((prev) => [
      ...prev,
      {
        messageId: `msg-${Date.now()}`,
        scope: 'individual',
        chatId: newDelivery.chatId,
        deliveryId,
        senderRole: 'system',
        senderId: 'system',
        senderName: settings.appName,
        text: `Entrega #${deliveryId.slice(-4)} criada. TOKEN do cliente: ${token}.`,
        createdAt: now,
      },
    ]);

    drivers
      .filter((d) => d.active && d.isOnline)
      .forEach((d) =>
        pushNotification(
          d.driverId,
          'Nova entrega disponível',
          `${storeRecord.businessName}: ${pickupArea} → ${dropoffArea} (${formatCurrency(
            newDelivery.feeAmount
          )})`,
          deliveryId
        )
      );

    notifyBanner(`Entrega publicada! TOKEN do cliente: ${token}`, 'success');
  };

  // Transaction-style atomic acceptance: first driver to claim wins; duplicates are blocked
  const handleAcceptDelivery = (deliveryId) => {
    const driver = drivers.find((d) => d.driverId === currentUser?.uid);
    if (!driver || !driver.active) {
      notifyBanner('Motoboy inativo.', 'error');
      return;
    }
    if (!driver.isOnline) {
      notifyBanner('Fique ONLINE para aceitar corridas.', 'error');
      return;
    }
    if (driver.activeDeliveryId) {
      notifyBanner('Você já possui uma entrega ativa.', 'error');
      return;
    }

    const current = deliveries.find((d) => d.deliveryId === deliveryId);
    if (
      !current ||
      current.assignedDriverId ||
      !['Disponível', 'Aguardando novo motoboy'].includes(current.status)
    ) {
      notifyBanner('Esta corrida já foi assumida por outro motoboy.', 'error');
      return;
    }

    const now = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.deliveryId !== deliveryId || d.assignedDriverId) return d;
        return {
          ...d,
          status: 'Aceita',
          assignedDriverId: driver.driverId,
          assignedDriverName: driver.fullName,
          assignedDriverPhone: driver.phone,
          updatedAt: now,
        };
      })
    );

    setDrivers((prev) =>
      prev.map((d) =>
        d.driverId === driver.driverId ? { ...d, activeDeliveryId: deliveryId } : d
      )
    );

    pushGroupFeedEvent({
      deliveryId,
      eventType: 'accepted',
      storeName: current.storeName,
      pickupArea: current.pickupArea,
      dropoffArea: current.dropoffArea,
      orderSummary: current.orderSummary,
      feeAmount: current.feeAmount,
      driverName: driver.fullName,
      statusAfter: 'Aceita',
      description: `Corrida assumida por ${driver.fullName}.`,
    });

    pushNotification(
      current.storeId,
      'Corrida aceita',
      `${driver.fullName} assumiu a entrega #${deliveryId.slice(-4)}.`,
      deliveryId
    );
    notifyBanner(`Você assumiu a entrega #${deliveryId.slice(-4)}!`, 'success');
    startDriverLiveWatch(deliveryId);
  };

  const handleRefuseOffer = (delivery) => {
    pushGroupFeedEvent({
      deliveryId: delivery.deliveryId,
      eventType: 'refused',
      storeName: delivery.storeName,
      pickupArea: delivery.pickupArea,
      dropoffArea: delivery.dropoffArea,
      orderSummary: delivery.orderSummary,
      feeAmount: delivery.feeAmount,
      driverName: currentUser?.displayName || 'Motoboy',
      statusAfter: delivery.status,
      description: `${currentUser?.displayName || 'Motoboy'} recusou a oferta.`,
    });
    notifyBanner('Oferta recusada. Ela continua disponível para outros motoboys.', 'info');
  };

  const handleWithdrawDelivery = (deliveryId, reason = 'Desistência do motoboy') => {
    const current = deliveries.find((d) => d.deliveryId === deliveryId);
    if (!current || !current.assignedDriverId) return;

    const prevDriverId = current.assignedDriverId;
    const prevDriverName = current.assignedDriverName;
    const now = new Date().toISOString();

    setDeliveries((prev) =>
      prev.map((d) =>
        d.deliveryId === deliveryId
          ? {
              ...d,
              status: 'Aguardando novo motoboy',
              assignedDriverId: null,
              assignedDriverName: null,
              assignedDriverPhone: null,
              driverLocation: null,
              updatedAt: now,
            }
          : d
      )
    );

    setDrivers((prev) =>
      prev.map((dr) =>
        dr.driverId === prevDriverId ? { ...dr, activeDeliveryId: null } : dr
      )
    );

    pushGroupFeedEvent({
      deliveryId,
      eventType: 'withdrawn_requeued',
      storeName: current.storeName,
      pickupArea: current.pickupArea,
      dropoffArea: current.dropoffArea,
      orderSummary: current.orderSummary,
      feeAmount: current.feeAmount,
      driverName: prevDriverName,
      statusAfter: 'Aguardando novo motoboy',
      description: `${prevDriverName} desistiu (${reason}). Corrida liberada novamente para outros motoboys.`,
    });

    pushNotification(
      current.storeId,
      'Desistência registrada',
      `${prevDriverName} desistiu da entrega #${deliveryId.slice(-4)}. Disponibilizada novamente.`,
      deliveryId
    );

    drivers
      .filter((dr) => dr.active && dr.isOnline && dr.driverId !== prevDriverId)
      .forEach((dr) =>
        pushNotification(
          dr.driverId,
          'Entrega disponível novamente',
          `${current.storeName}: ${current.pickupArea} → ${current.dropoffArea} (${formatCurrency(
            current.feeAmount
          )})`,
          deliveryId
        )
      );

    notifyBanner('Desistência registrada. Corrida devolvida ao grupo principal.', 'info');
  };

  const handleTransitionStatus = (deliveryId, nextStatus, actorRole) => {
    const current = deliveries.find((d) => d.deliveryId === deliveryId);
    if (!current) return;

    if (actorRole === 'driver' && current.assignedDriverId !== currentUser?.uid) {
      notifyBanner('Sem permissão para alterar o status desta entrega.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const isTerminal = ['Concluída', 'Cancelada'].includes(nextStatus);

    setDeliveries((prev) =>
      prev.map((d) =>
        d.deliveryId === deliveryId
          ? {
              ...d,
              status: nextStatus,
              completedAt: nextStatus === 'Concluída' ? now : d.completedAt,
              driverLocation: isTerminal ? null : d.driverLocation,
              updatedAt: now,
            }
          : d
      )
    );

    if (isTerminal && current.assignedDriverId) {
      setDrivers((prev) =>
        prev.map((dr) =>
          dr.driverId === current.assignedDriverId ? { ...dr, activeDeliveryId: null } : dr
        )
      );
    }

    pushGroupFeedEvent({
      deliveryId,
      eventType: nextStatus === 'Cancelada' ? 'cancelled' : nextStatus === 'Concluída' ? 'completed' : 'status',
      storeName: current.storeName,
      pickupArea: current.pickupArea,
      dropoffArea: current.dropoffArea,
      orderSummary: current.orderSummary,
      feeAmount: current.feeAmount,
      driverName: current.assignedDriverName,
      statusAfter: nextStatus,
      description: `Status atualizado para "${nextStatus}".`,
    });

    pushNotification(
      current.storeId,
      `Entrega ${nextStatus}`,
      `Pedido #${deliveryId.slice(-4)} agora está: ${nextStatus}.`,
      deliveryId
    );
    notifyBanner(`Status alterado para: ${nextStatus}`, 'success');
  };

  const startDriverLiveWatch = (deliveryId) => {
    if (!('geolocation' in navigator)) {
      setGpsPermissionState('denied');
      setGpsError('Este navegador não oferece suporte a geolocalização GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPermissionState('granted');
        setGpsError(null);
        const ts = new Date().toISOString();
        setDeliveries((prev) =>
          prev.map((d) =>
            d.deliveryId === deliveryId
              ? {
                  ...d,
                  driverLocation: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    updatedAt: ts,
                  },
                  updatedAt: ts,
                }
              : d
          )
        );
      },
      (err) => {
        setGpsPermissionState('denied');
        setGpsError(
          err.code === 1
            ? 'Permissão de GPS negada. Ative a localização para compartilhar seu deslocamento.'
            : 'Não foi possível obter sua localização GPS agora.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (currentUser?.role !== 'driver') return;
    const activeDel = deliveries.find(
      (d) =>
        d.assignedDriverId === currentUser.uid &&
        ['Aceita', 'Indo buscar', 'Pedido retirado', 'Em deslocamento'].includes(d.status)
    );
    if (!activeDel || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPermissionState('granted');
        setGpsError(null);
        const now = new Date().toISOString();
        setDeliveries((prev) =>
          prev.map((d) =>
            d.deliveryId === activeDel.deliveryId
              ? {
                  ...d,
                  driverLocation: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    updatedAt: now,
                  },
                  updatedAt: now,
                }
              : d
          )
        );
      },
      (err) => {
        if (err.code === 1) {
          setGpsPermissionState('denied');
          setGpsError(
            'GPS sem permissão. Autorize a localização para atualizar o mapa em tempo real.'
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentUser, deliveries]);

  const handleSendChatMessage = (payload) => {
    setMessages((prev) => [
      ...prev,
      {
        messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        scope: 'individual',
        ...payload,
      },
    ]);
  };

  const handleRateDelivery = (delivery, stars, comment) => {
    if (delivery.status !== 'Concluída' || delivery.rated) return;
    const now = new Date().toISOString();
    const score = Number(stars);

    setDeliveries((prev) =>
      prev.map((d) => (d.deliveryId === delivery.deliveryId ? { ...d, rated: true } : d))
    );

    setRatings((prev) => [
      {
        ratingId: `rat-${Date.now()}`,
        deliveryId: delivery.deliveryId,
        storeId: delivery.storeId,
        driverId: delivery.assignedDriverId,
        driverName: delivery.assignedDriverName || 'Motoboy',
        customerName: delivery.customerName,
        stars: score,
        comment: comment.trim(),
        createdAt: now,
      },
      ...prev,
    ]);

    if (delivery.assignedDriverId) {
      setDrivers((prev) =>
        prev.map((dr) => {
          if (dr.driverId !== delivery.assignedDriverId) return dr;
          const count = dr.ratingCount || 0;
          const avg = dr.ratingAvg || 5;
          const nextCount = count + 1;
          const nextAvg = Number(((avg * count + score) / nextCount).toFixed(2));
          return { ...dr, ratingCount: nextCount, ratingAvg: nextAvg };
        })
      );
      pushNotification(
        delivery.assignedDriverId,
        'Nova avaliação recebida',
        `Você recebeu ${score} estrela(s) na entrega #${delivery.deliveryId.slice(-4)}.`,
        delivery.deliveryId
      );
    }

    notifyBanner('Avaliação enviada com sucesso!', 'success');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-[#0a0a0a] flex flex-col font-sans antialiased">
      {banner && (
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 border-b ${
            banner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-[#15803d]'
              : 'bg-neutral-50 border-neutral-200 text-[#0a0a0a]'
          }`}
        >
          <span>{banner.msg}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="underline font-bold shrink-0 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {view === 'customer-entry' && (
        <CustomerEntryScreen
          sampleToken={deliveries[0]?.trackingToken || 'CB-83921X'}
          onSubmitToken={handleCustomerTokenAccess}
          onOpenStaffLogin={() => setView('staff-login')}
        />
      )}

      {view === 'staff-login' && (
        <StaffLoginScreen
          hasPrincipalAdmin={hasPrincipalAdmin}
          users={users}
          onBootstrapPrincipalAdmin={handleBootstrapPrincipalAdmin}
          onLogin={handleStaffLogin}
          onBackToCustomer={() => setView('customer-entry')}
          notifyBanner={notifyBanner}
        />
      )}

      {view === 'tracking' && (
        <CustomerTrackingScreen
          settings={settings}
          token={customerToken}
          deliveries={deliveries}
          drivers={drivers}
          messages={messages}
          onSendMessage={handleSendChatMessage}
          onRateDelivery={handleRateDelivery}
          onExit={() => {
            setCustomerToken('');
            setView('customer-entry');
          }}
        />
      )}

      {view === 'admin' && currentUser?.role === 'admin' && (
        <AdminWorkspace
          settings={settings}
          setSettings={setSettings}
          currentUser={currentUser}
          onChangeInitialPassword={handleCompletePasswordChange}
          users={users}
          setUsers={setUsers}
          stores={stores}
          setStores={setStores}
          drivers={drivers}
          setDrivers={setDrivers}
          deliveries={deliveries}
          groupFeed={groupFeed}
          messages={messages}
          onCleanupOldMessages={() => {
            runMessageRetentionCleanup();
            notifyBanner('Rotina de retenção de 15 dias executada.', 'success');
          }}
          ratings={ratings}
          adminLogs={adminLogs}
          pushAdminLog={pushAdminLog}
          onLogout={handleLogout}
          notifyBanner={notifyBanner}
        />
      )}

      {view === 'store' && currentUser?.role === 'store' && (
        <StoreWorkspace
          settings={settings}
          currentUser={currentUser}
          stores={stores}
          deliveries={deliveries}
          groupFeed={groupFeed}
          messages={messages}
          notifications={notifications}
          gpsPermissionState={gpsPermissionState}
          gpsError={gpsError}
          onPublishDelivery={handlePublishDelivery}
          onCancelDelivery={(id) => handleTransitionStatus(id, 'Cancelada', 'store')}
          onSendMessage={handleSendChatMessage}
          onOpenCustomerTracking={(tok) => {
            setCustomerToken(tok);
            setView('tracking');
          }}
          onLogout={handleLogout}
          notifyBanner={notifyBanner}
        />
      )}

      {view === 'driver' && currentUser?.role === 'driver' && (
        <DriverWorkspace
          settings={settings}
          currentUser={currentUser}
          drivers={drivers}
          setDrivers={setDrivers}
          deliveries={deliveries}
          groupFeed={groupFeed}
          messages={messages}
          notifications={notifications}
          gpsPermissionState={gpsPermissionState}
          gpsError={gpsError}
          onAcceptDelivery={handleAcceptDelivery}
          onRefuseOffer={handleRefuseOffer}
          onWithdrawDelivery={handleWithdrawDelivery}
          onAdvanceStatus={(id, next) => handleTransitionStatus(id, next, 'driver')}
          onCaptureGps={startDriverLiveWatch}
          onSendMessage={handleSendChatMessage}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// ============================================================================
// 8. CUSTOMER TOKEN ENTRY SCREEN (FIRST DEFAULT SCREEN)
// ============================================================================
function CustomerEntryScreen({ sampleToken, onSubmitToken, onOpenStaffLogin }) {
  const [token, setToken] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleForm = (e) => {
    e.preventDefault();
    const result = onSubmitToken(token);
    if (!result.ok) {
      setErrorText(result.message);
    } else {
      setErrorText('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col justify-between px-5 py-8">
      <header className="w-full max-w-sm mx-auto pt-3 flex flex-col items-center text-center">
        <CaboonLogo size="lg" showSubtitle />
      </header>

      <main className="w-full max-w-sm mx-auto my-auto py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Acompanhe sua entrega
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Digite o código fornecido pela loja para acompanhar seu pedido.
          </p>
        </div>

        {errorText && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleForm} className="space-y-4">
          <div>
            <label
              htmlFor="token-code-input"
              className="block text-xs font-semibold text-[#0a0a0a] mb-1.5"
            >
              Código da entrega (TOKEN)
            </label>
            <input
              id="token-code-input"
              type="text"
              required
              autoComplete="off"
              value={token}
              onChange={(e) => {
                setToken(e.target.value.toUpperCase());
                if (errorText) setErrorText('');
              }}
              placeholder="CB-83921X"
              className="w-full px-3.5 py-3 rounded-lg border border-neutral-300 bg-white text-sm font-mono font-bold tracking-wider uppercase text-[#0a0a0a] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>ACOMPANHAR ENTREGA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setToken(sampleToken);
              setErrorText('');
            }}
            className="text-xs text-neutral-500 hover:text-[#16a34a] cursor-pointer"
          >
            Usar código de exemplo:{' '}
            <span className="font-mono font-bold text-[#16a34a] underline">
              {sampleToken}
            </span>
          </button>
        </div>
      </main>

      <footer className="w-full max-w-sm mx-auto pt-4 border-t border-neutral-100 text-center space-y-2.5">
        <p className="text-xs text-neutral-500">
          É lojista, motoboy ou administrador?
        </p>
        <button
          type="button"
          onClick={onOpenStaffLogin}
          className="px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-[#0a0a0a] text-xs font-semibold transition-colors cursor-pointer"
        >
          ACESSAR PAINEL
        </button>
      </footer>
    </div>
  );
}

// ============================================================================
// 9. INTERNAL STAFF LOGIN SCREEN (SECOND PAGE — NO PUBLIC SIGNUP)
// ============================================================================
function StaffLoginScreen({
  hasPrincipalAdmin,
  users,
  onBootstrapPrincipalAdmin,
  onLogin,
  onBackToCustomer,
  notifyBanner,
}) {
  const [screenMode, setScreenMode] = useState(hasPrincipalAdmin ? 'login' : 'bootstrap');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setScreenMode(hasPrincipalAdmin ? 'login' : 'bootstrap');
  }, [hasPrincipalAdmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (screenMode === 'bootstrap') {
      onBootstrapPrincipalAdmin({
        email,
        password,
        displayName: adminName,
      });
    } else if (screenMode === 'reset') {
      if (!email.trim()) {
        notifyBanner('Informe seu e-mail cadastrado.', 'error');
        return;
      }
      notifyBanner(
        'Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas.',
        'success'
      );
      setScreenMode('login');
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col justify-between px-5 py-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={onBackToCustomer}
          className="text-xs font-medium text-neutral-500 hover:text-[#0a0a0a] cursor-pointer"
        >
          ← Voltar para acompanhamento por TOKEN
        </button>
      </div>

      <main className="w-full max-w-sm mx-auto my-auto py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <CaboonLogo size="md" />
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a] mt-5">
            {screenMode === 'bootstrap'
              ? 'Inicializar administrador'
              : screenMode === 'reset'
              ? 'Recuperar senha'
              : 'Bem-vindo(a) de volta'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {screenMode === 'bootstrap'
              ? 'Configure a primeira conta do administrador principal.'
              : screenMode === 'reset'
              ? 'Digite seu e-mail para recuperar o acesso.'
              : 'Entre para acessar seu painel.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {screenMode === 'bootstrap' && (
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
                Nome do administrador principal
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ex.: Administrador Principal"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex.: adm@caboondelivery"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15"
              />
            </div>
          </div>

          {screenMode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#0a0a0a]">
                  Senha
                </label>
                {screenMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setScreenMode('reset')}
                    className="text-xs font-medium text-[#16a34a] hover:underline cursor-pointer"
                  >
                    Recuperar senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#0a0a0a] cursor-pointer"
                  aria-label="Mostrar ou ocultar senha"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            {screenMode === 'bootstrap'
              ? 'CRIAR ADMINISTRADOR PRINCIPAL'
              : screenMode === 'reset'
              ? 'ENVIAR RECUPERAÇÃO'
              : 'ENTRAR'}
          </button>

          {screenMode === 'reset' && (
            <button
              type="button"
              onClick={() => setScreenMode('login')}
              className="w-full py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold text-[#0a0a0a] hover:bg-neutral-50 cursor-pointer"
            >
              Voltar ao login
            </button>
          )}
        </form>

        {screenMode === 'login' && (
          <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
            <p className="text-[11px] font-medium text-neutral-400">
              Acesso rápido de demonstração:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('adm@caboondelivery');
                  setPassword('caboon123');
                  onLogin('adm@caboondelivery', 'caboon123');
                }}
                className="px-2.5 py-1 rounded-md border border-green-200 bg-green-50 text-[#15803d] text-[11px] font-bold cursor-pointer"
              >
                Admin Principal (adm@caboondelivery)
              </button>
              {users
                .filter((u) => u.uid !== 'admin-principal')
                .map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      const demoPass = u.role === 'store' ? 'loja123' : 'moto123';
                      setPassword(demoPass);
                      onLogin(u.email, demoPass);
                    }}
                    className="px-2.5 py-1 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-semibold text-[#0a0a0a] cursor-pointer"
                  >
                    {u.role === 'store' ? 'Lojista' : 'Motoboy'}: {u.displayName.split(' ')[0]}
                  </button>
                ))}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-sm mx-auto text-center text-[11px] text-neutral-400">
        Sem cadastro público • Credenciais gerenciadas pela administração
      </footer>
    </div>
  );
}

// ============================================================================
// 10. CUSTOMER TRACKING SCREEN (MAP + DRIVER CARD + CHAT + RATING)
// ============================================================================
function CustomerTrackingScreen({
  settings,
  token,
  deliveries,
  drivers,
  messages,
  onSendMessage,
  onRateDelivery,
  onExit,
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [eta, setEta] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const delivery = useMemo(
    () =>
      deliveries.find(
        (d) => d.trackingToken.toUpperCase() === (token || '').toUpperCase()
      ) || null,
    [token, deliveries]
  );

  const assignedDriver = useMemo(
    () => drivers.find((dr) => dr.driverId === delivery?.assignedDriverId) || null,
    [drivers, delivery?.assignedDriverId]
  );

  if (!delivery || delivery.trackingRevoked) {
    return (
      <div className="min-h-screen bg-white text-[#0a0a0a] flex items-center justify-center p-5">
        <div className="max-w-sm w-full border border-neutral-200 rounded-xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h1 className="font-bold text-base">Código inválido ou revogado</h1>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 rounded-lg bg-[#16a34a] text-white font-semibold text-xs cursor-pointer"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-4 h-14 flex items-center justify-between">
        <CaboonLogo size="sm" />
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-100">
            {delivery.trackingToken}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-semibold text-neutral-500 hover:text-[#0a0a0a] cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        <UberStyleLiveMap
          delivery={delivery}
          googleMapsApiKey={settings.googleMapsApiKey}
          onEtaCalculated={setEta}
          tall
        />

        <div className="grid md:grid-cols-12 gap-5">
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-xs font-semibold text-[#16a34a]">
                    {delivery.storeName}
                  </span>
                  <h1 className="text-lg font-bold">Olá, {delivery.customerName}</h1>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[#15803d] text-xs font-bold">
                  {delivery.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 text-[#16a34a] flex items-center justify-center shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-500">Motoboy responsável</p>
                    <p className="text-sm font-bold text-[#0a0a0a]">
                      {delivery.assignedDriverName || 'Aguardando aceitação no grupo'}
                    </p>
                    {assignedDriver && (
                      <p className="text-[11px] text-neutral-600 flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-[#16a34a]">
                          <Star className="w-3 h-3 fill-[#16a34a]" />
                          {assignedDriver.ratingAvg.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {assignedDriver.phone}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {eta && eta.durationText && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-neutral-500 block">Previsão</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#16a34a]">
                      <Clock className="w-3.5 h-3.5" />
                      {eta.durationText}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-neutral-700">
                <p>
                  <strong>Pedido:</strong> {delivery.orderSummary}
                </p>
                <p>
                  <strong>Destino:</strong> {delivery.dropoffAddress}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowChat((prev) => !prev)}
                className="w-full py-2.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-[#0a0a0a] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#16a34a]" />
                <span>
                  {showChat
                    ? 'Fechar chat com loja e motoboy'
                    : 'Abrir chat com loja e motoboy'}
                </span>
              </button>
            </div>

            {delivery.status === 'Concluída' && !delivery.rated && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onRateDelivery(delivery, stars, comment);
                  setComment('');
                }}
                className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3"
              >
                <h2 className="text-sm font-bold">
                  Avaliar entrega de {delivery.assignedDriverName}
                </h2>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStars(n)}
                      className="p-2 rounded-lg border border-neutral-200 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          n <= stars
                            ? 'text-[#16a34a] fill-[#16a34a]'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentário opcional sobre a entrega..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#16a34a]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-xs cursor-pointer"
                >
                  Enviar avaliação
                </button>
              </form>
            )}

            {delivery.rated && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-2 text-xs font-semibold text-[#15803d]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Avaliação concluída. Obrigado!</span>
              </div>
            )}
          </div>

          <div className={`md:col-span-5 ${showChat ? 'block' : 'hidden md:block'}`}>
            <IndividualDeliveryChat
              chatId={delivery.chatId}
              messages={messages}
              currentUserId={delivery.trackingToken}
              currentUserName={delivery.customerName}
              currentRole="customer"
              onSendMessage={onSendMessage}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-100 py-4 px-4 text-center text-xs text-neutral-400">
        {settings.appName} • {settings.regionName}
      </footer>
    </div>
  );
}

// ============================================================================
// 11. STORE WORKSPACE (PUBLISH WITH AUTOCOMPLETE + TRACKING + CHAT + GROUP)
// ============================================================================
function StoreWorkspace({
  settings,
  currentUser,
  stores,
  deliveries,
  groupFeed,
  messages,
  notifications,
  gpsPermissionState,
  gpsError,
  onPublishDelivery,
  onCancelDelivery,
  onSendMessage,
  onOpenCustomerTracking,
  onLogout,
  notifyBanner,
}) {
  const [tab, setTab] = useState('nova');
  const myStore = useMemo(
    () => stores.find((s) => s.storeId === currentUser.uid),
    [stores, currentUser.uid]
  );
  const myDeliveries = useMemo(
    () => deliveries.filter((d) => d.storeId === currentUser.uid),
    [deliveries, currentUser.uid]
  );

  const [selectedDeliveryId, setSelectedDeliveryId] = useState(
    myDeliveries[0]?.deliveryId || ''
  );
  const selectedDelivery =
    myDeliveries.find((d) => d.deliveryId === selectedDeliveryId) ||
    myDeliveries[0] ||
    null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [orderSummary, setOrderSummary] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const myNotifs = notifications.filter((n) => n.recipientUid === currentUser.uid);

  const handleConfirmPublish = async () => {
    const normalizedFee = parseFloat(String(feeAmount || '').replace(',', '.'));
    if (!customerName.trim() || !customerPhone.trim() || !pickupAddress.trim() || !dropoffAddress.trim() || !orderSummary.trim() || Number.isNaN(normalizedFee) || normalizedFee <= 0) {
      notifyBanner('Preencha todos os campos obrigatórios com um valor válido.', 'error');
      return;
    }
    await onPublishDelivery({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      pickupAddress: pickupAddress.trim(),
      pickupCoords: pickupCoords || myStore?.coords || null,
      dropoffAddress: dropoffAddress.trim(),
      dropoffCoords,
      orderSummary: orderSummary.trim(),
      feeAmount: normalizedFee,
      notes: notes.trim(),
    });
    setCustomerName('');
    setCustomerPhone('');
    setPickupAddress('');
    setPickupCoords(null);
    setDropoffAddress('');
    setDropoffCoords(null);
    setOrderSummary('');
    setFeeAmount('');
    setNotes('');
    setReviewing(false);
    setTab('entregas');
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <CaboonLogo size="sm" />
            <span className="hidden sm:inline-block text-xs font-semibold text-neutral-500 border-l border-neutral-200 pl-3 truncate">
              Lojista • {myStore?.businessName || currentUser.displayName}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 overflow-x-auto pb-2">
          {[
            { id: 'nova', label: 'Publicar Entrega', icon: PlusCircle },
            { id: 'entregas', label: 'Minhas Entregas', icon: Store },
            { id: 'grupo', label: 'Grupo Principal', icon: Radio },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === item.id
                    ? 'bg-[#16a34a] text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {myNotifs.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center gap-2 text-xs">
            <Bell className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span className="font-bold">{myNotifs[0].title}:</span>
            <span className="text-neutral-600 truncate">{myNotifs[0].body}</span>
          </div>
        )}

        {tab === 'nova' && (
          <div className="max-w-xl mx-auto bg-white rounded-xl border border-neutral-200 p-6">
            <h1 className="text-lg font-bold">Nova entrega</h1>
            <p className="text-xs text-neutral-500 mt-1 mb-5">
              Digite o endereço para receber sugestões reais em Cabo de Santo Agostinho e região.
            </p>

            {!reviewing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReviewing(true);
                }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nome do cliente *</label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex.: Mariana Lima"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Telefone *</label>
                    <input
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(81) 99000-0000"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <AddressAutocompleteInput
                  label="Endereço de retirada *"
                  required
                  value={pickupAddress}
                  onChange={setPickupAddress}
                  onSelectAddress={(sel) => {
                    setPickupAddress(sel.address);
                    setPickupCoords(sel.coords);
                  }}
                  placeholder="Ex.: Rua das Flores, 120"
                  googleMapsApiKey={settings.googleMapsApiKey}
                />

                <AddressAutocompleteInput
                  label="Endereço de entrega *"
                  required
                  value={dropoffAddress}
                  onChange={(val) => {
                    setDropoffAddress(val);
                    setDropoffCoords(null);
                  }}
                  onSelectAddress={(sel) => {
                    setDropoffAddress(sel.address);
                    setDropoffCoords(sel.coords);
                  }}
                  placeholder="Ex.: Rua das Flores, 120"
                  googleMapsApiKey={settings.googleMapsApiKey}
                />

                <div className="grid sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">
                      Descrição do pedido *
                    </label>
                    <input
                      required
                      value={orderSummary}
                      onChange={(e) => setOrderSummary(e.target.value)}
                      placeholder="Ex.: 1 marmita e 1 refrigerante"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Valor (R$) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      placeholder="Ex.: 10,00"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Observações</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex.: Ponto de referência ou complemento."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm cursor-pointer"
                >
                  Revisar publicação
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs">
                  <p>
                    <strong>Cliente:</strong> {customerName} ({customerPhone})
                  </p>
                  <p>
                    <strong>Retirada:</strong> {pickupAddress}
                  </p>
                  <p>
                    <strong>Destino:</strong> {dropoffAddress}
                  </p>
                  <p>
                    <strong>Pedido:</strong> {orderSummary}
                  </p>
                  <p className="text-sm font-bold text-[#16a34a] pt-1">
                    Valor da corrida:{' '}
                    {formatCurrency(parseFloat(String(feeAmount || '0').replace(',', '.')) || 0)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewing(false)}
                    className="py-2.5 rounded-lg border border-neutral-300 font-semibold text-xs cursor-pointer"
                  >
                    Voltar e editar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPublish}
                    className="py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-xs cursor-pointer"
                  >
                    Confirmar e publicar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'entregas' && (
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-2.5">
              {myDeliveries.map((del) => (
                <div
                  key={del.deliveryId}
                  onClick={() => setSelectedDeliveryId(del.deliveryId)}
                  className={`p-4 rounded-xl border bg-white cursor-pointer ${
                    selectedDelivery?.deliveryId === del.deliveryId
                      ? 'border-[#16a34a] ring-1 ring-[#16a34a]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#16a34a]">{del.status}</span>
                    <span className="font-bold">{formatCurrency(del.feeAmount)}</span>
                  </div>
                  <p className="font-bold text-sm mt-1">
                    {del.customerName}{' '}
                    <span className="font-mono text-xs text-neutral-500">
                      ({del.trackingToken})
                    </span>
                  </p>
                  <p className="text-xs text-neutral-600 truncate">{del.dropoffAddress}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Motoboy: {del.assignedDriverName || 'Aguardando motoboy'}
                  </p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7 space-y-4">
              {selectedDelivery && (
                <>
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs">
                      <p className="text-neutral-500">TOKEN do cliente</p>
                      <p className="font-mono font-bold text-sm text-[#16a34a]">
                        {selectedDelivery.trackingToken}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedDelivery.trackingToken);
                          setCopiedId(selectedDelivery.deliveryId);
                          notifyBanner('TOKEN copiado!', 'success');
                        }}
                        className="px-3 py-2 rounded-lg bg-[#16a34a] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === selectedDelivery.deliveryId ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copiar TOKEN
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCustomerTracking(selectedDelivery.trackingToken)}
                        className="px-3 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Acompanhar cliente
                      </button>
                      {!['Concluída', 'Cancelada'].includes(selectedDelivery.status) && (
                        <button
                          type="button"
                          onClick={() => onCancelDelivery(selectedDelivery.deliveryId)}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  <UberStyleLiveMap
                    delivery={selectedDelivery}
                    googleMapsApiKey={settings.googleMapsApiKey}
                    gpsPermissionState={gpsPermissionState}
                    gpsError={gpsError}
                  />

                  <IndividualDeliveryChat
                    chatId={selectedDelivery.chatId}
                    messages={messages}
                    currentUserId={currentUser.uid}
                    currentUserName={myStore?.businessName || currentUser.displayName}
                    currentRole="store"
                    onSendMessage={onSendMessage}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'grupo' && (
          <PrincipalGroupFeedView
            deliveries={deliveries}
            groupFeed={groupFeed}
            canAccept={false}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 12. DRIVER WORKSPACE (ONLINE/OFFLINE + GROUP + ACTIVE GPS + CHAT + HISTORY)
// ============================================================================
function DriverWorkspace({
  settings,
  currentUser,
  drivers,
  setDrivers,
  deliveries,
  groupFeed,
  messages,
  notifications,
  gpsPermissionState,
  gpsError,
  onAcceptDelivery,
  onRefuseOffer,
  onWithdrawDelivery,
  onAdvanceStatus,
  onCaptureGps,
  onSendMessage,
  onLogout,
}) {
  const driverProfile = useMemo(
    () => drivers.find((d) => d.driverId === currentUser.uid),
    [drivers, currentUser.uid]
  );

  const activeDelivery = useMemo(
    () =>
      deliveries.find(
        (d) =>
          d.assignedDriverId === currentUser.uid &&
          !['Concluída', 'Cancelada'].includes(d.status)
      ) || null,
    [deliveries, currentUser.uid]
  );

  const myHistory = useMemo(
    () => deliveries.filter((d) => d.assignedDriverId === currentUser.uid),
    [deliveries, currentUser.uid]
  );

  const [tab, setTab] = useState(activeDelivery ? 'ativa' : 'grupo');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  useEffect(() => {
    if (activeDelivery) setTab('ativa');
  }, [activeDelivery?.deliveryId]);

  const toggleOnline = () => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.driverId === currentUser.uid ? { ...d, isOnline: !d.isOnline } : d
      )
    );
  };

  const myNotifs = notifications.filter((n) => n.recipientUid === currentUser.uid);
  const nextStep = activeDelivery ? NEXT_DRIVER_STATUS[activeDelivery.status] : null;

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CaboonLogo size="sm" />
            <button
              type="button"
              onClick={toggleOnline}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                driverProfile?.isOnline
                  ? 'bg-green-50 border border-green-200 text-[#15803d]'
                  : 'bg-neutral-100 border border-neutral-200 text-neutral-600'
              }`}
            >
              {driverProfile?.isOnline ? '● ONLINE' : '○ OFFLINE'}
            </button>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 overflow-x-auto pb-2">
          {[
            { id: 'grupo', label: 'Grupo Principal', icon: Radio },
            { id: 'ativa', label: 'Entrega Ativa', icon: Bike },
            { id: 'historico', label: 'Histórico & Notas', icon: History },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === item.id
                    ? 'bg-[#16a34a] text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {myNotifs.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center gap-2 text-xs">
            <Bell className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span className="font-bold">{myNotifs[0].title}:</span>
            <span className="text-neutral-600 truncate">{myNotifs[0].body}</span>
          </div>
        )}

        {tab === 'grupo' && (
          <PrincipalGroupFeedView
            deliveries={deliveries}
            groupFeed={groupFeed}
            canAccept={Boolean(driverProfile?.isOnline && !activeDelivery)}
            onAccept={(id) => onAcceptDelivery(id)}
            onRefuse={(del) => onRefuseOffer(del)}
          />
        )}

        {tab === 'ativa' && (
          <div>
            {!activeDelivery ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center space-y-3">
                <p className="text-sm font-semibold">Nenhuma entrega ativa no momento.</p>
                <button
                  type="button"
                  onClick={() => setTab('grupo')}
                  className="px-4 py-2 rounded-lg bg-[#16a34a] text-white text-xs font-semibold cursor-pointer"
                >
                  Ir para o Grupo Principal
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#16a34a]">
                          Entrega #{activeDelivery.deliveryId.slice(-4)}
                        </span>
                        <h2 className="text-base font-bold">{activeDelivery.storeName}</h2>
                      </div>
                      <span className="text-base font-bold text-[#16a34a]">
                        {formatCurrency(activeDelivery.feeAmount)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                      <p>
                        <strong>Cliente:</strong> {activeDelivery.customerName} (
                        {activeDelivery.customerPhone})
                      </p>
                      <p>
                        <strong>Retirada:</strong> {activeDelivery.pickupAddress}
                      </p>
                      <p>
                        <strong>Entrega:</strong> {activeDelivery.dropoffAddress}
                      </p>
                      <p>
                        <strong>Pedido:</strong> {activeDelivery.orderSummary}
                      </p>
                    </div>

                    {nextStep && (
                      <button
                        type="button"
                        onClick={() =>
                          onAdvanceStatus(activeDelivery.deliveryId, nextStep.next)
                        }
                        className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm cursor-pointer"
                      >
                        {nextStep.label}
                      </button>
                    )}

                    {!confirmWithdraw ? (
                      <button
                        type="button"
                        onClick={() => setConfirmWithdraw(true)}
                        className="w-full py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-semibold text-xs cursor-pointer"
                      >
                        Desistir da corrida
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2.5 text-xs">
                        <p className="font-semibold text-red-800">
                          Confirmar desistência? A corrida voltará ao grupo principal para outro motoboy.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmWithdraw(false)}
                            className="py-2 rounded-lg bg-white border border-neutral-300 font-semibold cursor-pointer"
                          >
                            Continuar corrida
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmWithdraw(false);
                              onWithdrawDelivery(activeDelivery.deliveryId);
                              setTab('grupo');
                            }}
                            className="py-2 rounded-lg bg-red-700 text-white font-semibold cursor-pointer"
                          >
                            Confirmar desistência
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <UberStyleLiveMap
                    delivery={activeDelivery}
                    googleMapsApiKey={settings.googleMapsApiKey}
                    gpsPermissionState={gpsPermissionState}
                    gpsError={gpsError}
                    onRequestDeviceGps={() => onCaptureGps(activeDelivery.deliveryId)}
                  />
                </div>

                <div className="lg:col-span-5">
                  <IndividualDeliveryChat
                    chatId={activeDelivery.chatId}
                    messages={messages}
                    currentUserId={currentUser.uid}
                    currentUserName={driverProfile?.fullName || currentUser.displayName}
                    currentRole="driver"
                    onSendMessage={onSendMessage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'historico' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Média de avaliações</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-[#16a34a] fill-[#16a34a]" />
                  <span className="text-xl font-bold">
                    {(driverProfile?.ratingAvg || 5).toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({driverProfile?.ratingCount || 0} avaliações)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              {myHistory.map((item) => (
                <div key={item.deliveryId} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold">
                      {item.storeName} → {item.dropoffArea}
                    </p>
                    <p className="text-neutral-500">Status: {item.status}</p>
                  </div>
                  <span className="font-bold text-[#16a34a]">
                    {formatCurrency(item.feeAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 13. PRINCIPAL GROUP FEED (PERSISTENT OFFERS + FULL MOVEMENT HISTORY)
// ============================================================================
function PrincipalGroupFeedView({
  deliveries,
  groupFeed,
  canAccept,
  onAccept,
  onRefuse,
}) {
  const availableOffers = useMemo(
    () =>
      deliveries.filter(
        (d) => !d.assignedDriverId && ['Disponível', 'Aguardando novo motoboy'].includes(d.status)
      ),
    [deliveries]
  );

  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-3.5">
        <h2 className="text-base font-bold">
          Ofertas disponíveis no grupo principal ({availableOffers.length})
        </h2>

        {availableOffers.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
            Nenhuma corrida aguardando motoboy no momento.
          </div>
        ) : (
          availableOffers.map((item) => (
            <div
              key={item.deliveryId}
              className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                <span className="px-2.5 py-0.5 rounded bg-green-50 text-[#15803d] text-[11px] font-bold">
                  {item.status === 'Aguardando novo motoboy'
                    ? 'Disponibilizada novamente'
                    : 'Nova entrega disponível'}
                </span>
                <span className="text-base font-bold text-[#16a34a]">
                  {formatCurrency(item.feeAmount)}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <p>
                  <strong>Loja:</strong> {item.storeName}
                </p>
                <p>
                  <strong>Retirada:</strong> {item.pickupArea}
                </p>
                <p>
                  <strong>Destino:</strong> {item.dropoffArea}
                </p>
                <p>
                  <strong>Pedido:</strong> {item.orderSummary}
                </p>
              </div>

              {onAccept && (
                <div className="pt-2 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={!canAccept}
                    onClick={() => onAccept(item.deliveryId)}
                    className="py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ACEITAR CORRIDA
                  </button>
                  <button
                    type="button"
                    onClick={() => onRefuse && onRefuse(item)}
                    className="py-2.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-neutral-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    RECUSAR
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-sm font-bold">Histórico de movimentações do grupo</h3>
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 max-h-[540px] overflow-y-auto">
          {groupFeed.map((ev) => (
            <div key={ev.feedId} className="p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0a0a0a]">
                  #{ev.deliveryId.slice(-4)} • {ev.storeName}
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-semibold">
                  {ev.statusAfter}
                </span>
              </div>
              <p className="text-neutral-700">{ev.description}</p>
              <p className="text-[10px] text-neutral-400">
                {ev.pickupArea} → {ev.dropoffArea} • {formatCurrency(ev.feeAmount)} •{' '}
                {formatShortDate(ev.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 14. ADMIN WORKSPACE (FIRST-LOGIN PASSWORD CHANGE + MULTI-ADMIN + FULL OPS)
// ============================================================================
function AdminWorkspace({
  settings,
  setSettings,
  currentUser,
  onChangeInitialPassword,
  users,
  setUsers,
  stores,
  setStores,
  drivers,
  setDrivers,
  deliveries,
  groupFeed,
  messages,
  onCleanupOldMessages,
  ratings,
  adminLogs,
  pushAdminLog,
  onLogout,
  notifyBanner,
}) {
  const [tab, setTab] = useState('dashboard');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Account creation state (store, driver, or additional admin when principal)
  const [accountType, setAccountType] = useState('store');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');

  const isPrincipal = currentUser.adminLevel === 'principal';

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (accountType === 'admin' && !isPrincipal) {
      notifyBanner(
        'Somente o administrador principal pode cadastrar novos administradores.',
        'error'
      );
      return;
    }

    const now = new Date().toISOString();
    const uid = `${accountType}-${Date.now().toString().slice(-5)}`;

    const createdUser = {
      uid,
      email: email.trim().toLowerCase(),
      passwordHash: digestSecret(password),
      displayName: name.trim(),
      role: accountType,
      adminLevel: accountType === 'admin' ? 'secondary' : null,
      permissions:
        accountType === 'admin'
          ? {
              manageStores: true,
              manageDrivers: true,
              manageAdmins: false,
              manageDeliveries: true,
              viewRatings: true,
              manageSettings: false,
            }
          : null,
      mustChangePassword: false,
      status: 'active',
      createdAt: now,
    };

    setUsers((prev) => [...prev, createdUser]);

    if (accountType === 'store') {
      setStores((prev) => [
        ...prev,
        {
          storeId: uid,
          ownerUid: uid,
          businessName: name.trim(),
          contactName: contactName.trim() || name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          coords: { lat: -8.2869, lng: -35.0332 },
          category: category.trim() || 'Estabelecimento',
          active: true,
          createdAt: now,
        },
      ]);
      pushAdminLog('CREATE_STORE', 'store', uid, `Loja cadastrada: ${name.trim()}`);
    } else if (accountType === 'driver') {
      setDrivers((prev) => [
        ...prev,
        {
          driverId: uid,
          userUid: uid,
          fullName: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          notes: '',
          isOnline: false,
          activeDeliveryId: null,
          ratingAvg: 5.0,
          ratingCount: 0,
          active: true,
          createdAt: now,
        },
      ]);
      pushAdminLog('CREATE_DRIVER', 'driver', uid, `Motoboy cadastrado: ${name.trim()}`);
    } else {
      pushAdminLog('CREATE_ADMIN', 'user', uid, `Novo administrador: ${name.trim()}`);
    }

    setName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setAddress('');
    notifyBanner('Cadastro realizado com sucesso!', 'success');
  };

  const toggleUserStatus = (targetUid) => {
    if (targetUid === currentUser.uid) {
      notifyBanner('Não é permitido bloquear sua própria conta ativa.', 'error');
      return;
    }
    const target = users.find((u) => u.uid === targetUid);
    if (target?.adminLevel === 'principal' && !isPrincipal) {
      notifyBanner('Sem permissão para alterar o administrador principal.', 'error');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid !== targetUid) return u;
        const nextStatus = u.status === 'active' ? 'blocked' : 'active';
        pushAdminLog(
          'TOGGLE_USER_STATUS',
          u.role,
          targetUid,
          `${u.displayName} alterado para ${nextStatus}.`
        );
        return { ...u, status: nextStatus };
      })
    );
    setStores((prev) =>
      prev.map((s) => (s.storeId === targetUid ? { ...s, active: !s.active } : s))
    );
    setDrivers((prev) =>
      prev.map((d) =>
        d.driverId === targetUid ? { ...d, active: !d.active, isOnline: false } : d
      )
    );
  };

  const kpis = [
    { label: 'Lojistas', value: stores.length },
    { label: 'Motoboys', value: drivers.length },
    { label: 'Motoboys online', value: drivers.filter((d) => d.isOnline).length },
    {
      label: 'Disponíveis',
      value: deliveries.filter((d) =>
        ['Disponível', 'Aguardando novo motoboy'].includes(d.status)
      ).length,
    },
    {
      label: 'Em andamento',
      value: deliveries.filter((d) =>
        ['Aceita', 'Indo buscar', 'Pedido retirado', 'Em deslocamento'].includes(d.status)
      ).length,
    },
    {
      label: 'Concluídas',
      value: deliveries.filter((d) => d.status === 'Concluída').length,
    },
    {
      label: 'Canceladas',
      value: deliveries.filter((d) => d.status === 'Cancelada').length,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex flex-col">
      <header className="border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CaboonLogo size="sm" />
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 border-l border-neutral-200 pl-3 truncate">
              <Shield className="w-3.5 h-3.5 text-[#16a34a]" />
              {isPrincipal ? 'Administrador Principal' : 'Administrador'}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        <nav className="max-w-6xl mx-auto flex gap-1 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Indicadores', icon: LayoutDashboard },
            { id: 'cadastro', label: 'Cadastros', icon: UserPlus },
            { id: 'usuarios', label: 'Usuários', icon: Store },
            { id: 'grupo', label: 'Grupo & Corridas', icon: Radio },
            { id: 'avaliacoes', label: 'Avaliações & Logs', icon: Star },
            { id: 'config', label: 'Configurações', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === item.id
                    ? 'bg-[#16a34a] text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {currentUser.mustChangePassword && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newPasswordInput.length < 6) {
                notifyBanner('Use uma senha com pelo menos 6 caracteres.', 'error');
                return;
              }
              onChangeInitialPassword(newPasswordInput);
              setNewPasswordInput('');
            }}
            className="bg-green-50 border border-[#16a34a] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="text-xs">
              <p className="font-bold text-[#0a0a0a]">
                Troca obrigatória da senha inicial do administrador principal
              </p>
              <p className="text-neutral-600">
                Defina uma nova senha segura para concluir seu primeiro acesso.
              </p>
            </div>
            <div className="flex gap-2">
              <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              accountType === 'store'
                ? 'Ex.: Restaurante Sabor do Cabo'
                : 'Ex.: Mariana Lima'
            }
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
          />

          {accountType === 'store' && (
            <>
              <input
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex.: Mariana Lima"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
              />
              <AddressAutocompleteInput
                required
                value={address}
                onChange={setAddress}
                placeholder="Ex.: Rua das Flores, 120"
                googleMapsApiKey={settings.googleMapsApiKey}
              />
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Restaurante"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
              />
            </>
          )}

          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex.: (81) 99000-0000"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex.: contato@caboondelivery.com.br"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
          />
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ex.: Senha de acesso"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
          />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#16a34a] text-white font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Salvar senha
              </button>
            </div>
          </form>
        )}

        {tab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {kpis.map((item) => (
              <div
                key={item.label}
                className="bg-white p-4 rounded-xl border border-neutral-200"
              >
                <p className="text-xs font-medium text-neutral-500">{item.label}</p>
                <p className="text-2xl font-bold mt-1.5">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'cadastro' && (
          <form
            onSubmit={handleCreateAccount}
            className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-neutral-200 space-y-4"
          >
            <h1 className="text-lg font-bold">Cadastrar usuário</h1>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('store')}
                className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  accountType === 'store'
                    ? 'bg-[#16a34a] text-white'
                    : 'border border-neutral-300'
                }`}
              >
                Lojista
              </button>
              <button
                type="button"
                onClick={() => setAccountType('driver')}
                className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  accountType === 'driver'
                    ? 'bg-[#16a34a] text-white'
                    : 'border border-neutral-300'
                }`}
              >
                Motoboy
              </button>
              {isPrincipal && (
                <button
                  type="button"
                  onClick={() => setAccountType('admin')}
                  className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    accountType === 'admin'
                      ? 'bg-[#16a34a] text-white'
                      : 'border border-neutral-300'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                accountType === 'store' ? 'Nome do estabelecimento' : 'Nome completo'
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
            />

            {accountType === 'store' && (
              <>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                />
                <AddressAutocompleteInput
                  required
                  value={address}
                  onChange={setAddress}
                  placeholder="Endereço completo da loja"
                  googleMapsApiKey={settings.googleMapsApiKey}
                />
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoria"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
                />
              </>
            )}

            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail de acesso"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
            />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha inicial"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-[#16a34a]"
            />

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm cursor-pointer"
            >
              Cadastrar usuário
            </button>
          </form>
        )}

        {tab === 'usuarios' && (
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {users.map((u) => (
              <div key={u.uid} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-sm">
                    {u.displayName}{' '}
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-neutral-100 ml-1">
                      {u.role === 'admin'
                        ? u.adminLevel === 'principal'
                          ? 'Admin Principal'
                          : 'Admin'
                        : u.role === 'store'
                        ? 'Lojista'
                        : 'Motoboy'}
                    </span>
                  </p>
                  <p className="text-neutral-500">
                    {u.email} • Status: <strong>{u.status}</strong>
                  </p>
                </div>
                {u.uid !== currentUser.uid && (
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(u.uid)}
                    className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      u.status === 'active'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-[#15803d] border border-green-200'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {u.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'grupo' && (
          <div className="space-y-5">
            <PrincipalGroupFeedView
              deliveries={deliveries}
              groupFeed={groupFeed}
              canAccept={false}
            />

            <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              {deliveries.map((del) => (
                <div key={del.deliveryId} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-sm">
                      {del.storeName} → {del.customerName}{' '}
                      <span className="font-mono text-[#16a34a]">({del.trackingToken})</span>
                    </p>
                    <p className="text-neutral-500">
                      Status: <strong>{del.status}</strong> • Motoboy:{' '}
                      {del.assignedDriverName || 'Nenhum'}
                    </p>
                  </div>
                  <span className="font-bold text-[#16a34a]">
                    {formatCurrency(del.feeAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'avaliacoes' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
              <h3 className="font-bold text-sm">Avaliações dos clientes</h3>
              {ratings.length === 0 ? (
                <p className="text-xs text-neutral-500">Nenhuma avaliação registrada ainda.</p>
              ) : (
                ratings.map((r) => (
                  <div key={r.ratingId} className="p-3 rounded-lg bg-neutral-50 text-xs">
                    <p className="font-bold">
                      {r.driverName} — {'★'.repeat(r.stars)} ({r.stars}/5)
                    </p>
                    <p className="text-neutral-600 mt-0.5">{r.comment || 'Sem comentário.'}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Entrega #{r.deliveryId.slice(-4)} • {formatShortDate(r.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
              <h3 className="font-bold text-sm">Registros administrativos</h3>
              {adminLogs.map((l) => (
                <div key={l.logId} className="p-3 rounded-lg bg-neutral-50 text-xs">
                  <p className="font-bold">{l.action}</p>
                  <p className="text-neutral-600">{l.details}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {formatShortDate(l.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
            <h2 className="text-lg font-bold">Configurações gerais</h2>

            <div>
              <label className="block text-xs font-semibold mb-1">Nome oficial</label>
              <input
                value={settings.appName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, appName: e.target.value.toLowerCase() }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm lowercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Região de operação</label>
              <input
                value={settings.regionName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, regionName: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Chave Google Maps / Places API (opcional)
              </label>
              <input
                type="password"
                value={settings.googleMapsApiKey}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, googleMapsApiKey: e.target.value }))
                }
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm font-mono"
              />
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-600">
                Mensagens ativas: <strong>{messages.length}</strong> (expiram após{' '}
                {settings.messageRetentionDays} dias)
              </span>
              <button
                type="button"
                onClick={onCleanupOldMessages}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar &gt;15d
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                pushAdminLog(
                  'UPDATE_SETTINGS',
                  'settings',
                  'main',
                  'Configurações gerais da plataforma atualizadas.'
                );
                notifyBanner('Configurações salvas!', 'success');
              }}
              className="w-full py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold cursor-pointer"
            >
              Salvar configurações
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <CaboondeliveryPlatform />
    </ErrorBoundary>
  );
}

export default App;