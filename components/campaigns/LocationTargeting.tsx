"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  GeoJSONSource,
  Map as MapboxMap,
  MapMouseEvent,
  Marker as MapboxMarker,
} from "mapbox-gl";

export interface TargetLocation {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string;
}

interface LocationTargetingProps {
  locations: TargetLocation[];
  onChange: (locations: TargetLocation[]) => void;
}

interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number];
}

// Generate a circle polygon (64 points) from center and radius in km
function createCircleGeoJSON(
  lng: number,
  lat: number,
  radiusKm: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const coords: [number, number][] = [];
  const earthRadiusKm = 6371;

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const d = radiusKm / earthRadiusKm;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
        Math.cos(latRad) * Math.sin(d) * Math.cos(rad)
    );
    const newLngRad =
      lngRad +
      Math.atan2(
        Math.sin(rad) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLatRad)
      );

    coords.push([
      (newLngRad * 180) / Math.PI,
      (newLatRad * 180) / Math.PI,
    ]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

export default function LocationTargeting({
  locations,
  onChange,
}: LocationTargetingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const pendingMarkerRef = useRef<MapboxMarker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingFeature[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingPin, setPendingPin] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isInitializingMap, setIsInitializingMap] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const missingToken = !token;
  const searchDisabled = missingToken || !mapLoaded || !!errorMessage;

  const handleMapClick = useCallback(
    async (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat;
      let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      if (token) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`
          );

          if (res.ok) {
            const data = await res.json();
            if (data.features?.[0]?.place_name) {
              label = data.features[0].place_name;
            }
          } else {
            setErrorMessage(
              "Reverse geocoding failed. Check the Mapbox token and its URL restrictions."
            );
          }
        } catch {
          setErrorMessage(
            "Reverse geocoding failed. Check your network connection and Mapbox token."
          );
        }
      }

      setPendingPin({ lat, lng, label });
    },
    [token]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    if (!token) {
      setErrorMessage(
        "Location targeting is unavailable right now. Please try again later."
      );
      return undefined;
    }

    let map: MapboxMap | null = null;
    let cancelled = false;
    setIsInitializingMap(true);
    setErrorMessage(null);
    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled || !mapContainerRef.current) return;

        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [0, 20],
          zoom: 2,
        });
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          setMapLoaded(true);
          setIsInitializingMap(false);
          setErrorMessage(null);
        });

        map.on("error", (event) => {
          if (cancelled) return;
          setIsInitializingMap(false);
          setMapLoaded(false);
          setErrorMessage(
            event.error?.message ??
              "Mapbox failed to load. Check the token and whether it allows your current URL."
          );
        });

        map.on("click", handleMapClick);
      } catch {
        if (cancelled) return;
        setIsInitializingMap(false);
        setMapLoaded(false);
        setErrorMessage(
          "Mapbox failed to initialize. Check the token, install state, and browser console."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      map?.remove();
      mapRef.current = null;
      setMapLoaded(false);
      setIsInitializingMap(false);
    };
  }, [handleMapClick, token]);

  // Draw/update pending pin and circle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Remove old pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    // Remove old pending circle
    if (map.getLayer("pending-circle-fill")) map.removeLayer("pending-circle-fill");
    if (map.getLayer("pending-circle-outline")) map.removeLayer("pending-circle-outline");
    if (map.getSource("pending-circle")) map.removeSource("pending-circle");

    if (!pendingPin) return;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      // Add marker
      const el = document.createElement("div");
      el.className =
        "w-4 h-4 rounded-full border-2 border-white bg-orange-500 shadow-lg";
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pendingPin.lng, pendingPin.lat])
        .addTo(map);
      pendingMarkerRef.current = marker;

      // Add circle
      const circleGeoJSON = createCircleGeoJSON(pendingPin.lng, pendingPin.lat, radiusKm);
      map.addSource("pending-circle", {
        type: "geojson",
        data: circleGeoJSON,
      });
      map.addLayer({
        id: "pending-circle-fill",
        type: "fill",
        source: "pending-circle",
        paint: { "fill-color": "#f97316", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "pending-circle-outline",
        type: "line",
        source: "pending-circle",
        paint: { "line-color": "#f97316", "line-width": 1.5, "line-opacity": 0.8 },
      });
    })();
  }, [pendingPin, radiusKm, mapLoaded]);

  // Update pending circle when radius changes (source update)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !pendingPin) return;
    const map = mapRef.current;
    const source = map.getSource("pending-circle") as GeoJSONSource | undefined;
    if (source) {
      source.setData(createCircleGeoJSON(pendingPin.lng, pendingPin.lat, radiusKm));
    }
  }, [radiusKm, pendingPin, mapLoaded]);

  // Draw saved locations on map
  const drawSavedLocations = useCallback(async () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const mapboxgl = (await import("mapbox-gl")).default;

    // Remove old saved markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove old saved circle layers/sources
    locations.forEach((_, i) => {
      if (map.getLayer(`saved-circle-fill-${i}`)) map.removeLayer(`saved-circle-fill-${i}`);
      if (map.getLayer(`saved-circle-outline-${i}`)) map.removeLayer(`saved-circle-outline-${i}`);
      if (map.getSource(`saved-circle-${i}`)) map.removeSource(`saved-circle-${i}`);
    });
    // Also clean up any extra stale sources (remove up to 50 just in case)
    for (let i = locations.length; i < 50; i++) {
      if (map.getLayer(`saved-circle-fill-${i}`)) map.removeLayer(`saved-circle-fill-${i}`);
      if (map.getLayer(`saved-circle-outline-${i}`)) map.removeLayer(`saved-circle-outline-${i}`);
      if (map.getSource(`saved-circle-${i}`)) map.removeSource(`saved-circle-${i}`);
      else break;
    }

    locations.forEach((loc, i) => {
      const el = document.createElement("div");
      el.className =
        "w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-lg";
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);
      markersRef.current.push(marker);

      const circleGeoJSON = createCircleGeoJSON(loc.lng, loc.lat, loc.radiusKm);
      map.addSource(`saved-circle-${i}`, { type: "geojson", data: circleGeoJSON });
      map.addLayer({
        id: `saved-circle-fill-${i}`,
        type: "fill",
        source: `saved-circle-${i}`,
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: `saved-circle-outline-${i}`,
        type: "line",
        source: `saved-circle-${i}`,
        paint: { "line-color": "#3b82f6", "line-width": 1.5, "line-opacity": 0.8 },
      });
    });
  }, [locations, mapLoaded]);

  useEffect(() => {
    drawSavedLocations();
  }, [drawSavedLocations]);

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setErrorMessage((current) =>
      current?.startsWith("Location search failed") ? null : current
    );
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (!token) {
      setShowDropdown(false);
      setErrorMessage(
        "Location targeting is unavailable right now. Please try again later."
      );
      return;
    }

    if (!mapLoaded) {
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&limit=5`
        );
        if (!res.ok) {
          setSearchResults([]);
          setShowDropdown(false);
          setErrorMessage(
            "Location search failed. Check the Mapbox token and its URL restrictions."
          );
          return;
        }

        const data = await res.json();
        setSearchResults(data.features ?? []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
        setErrorMessage(
          "Location search failed. Check your network connection and Mapbox token."
        );
      }
    }, 300);
  }

  async function selectSearchResult(feature: GeocodingFeature) {
    const [lng, lat] = feature.center;
    setPendingPin({ lat, lng, label: feature.place_name });
    setSearchQuery(feature.place_name);
    setShowDropdown(false);
    setSearchResults([]);

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 10 });
    }
  }

  function addLocation() {
    if (!pendingPin) return;
    const newLocation: TargetLocation = {
      lat: pendingPin.lat,
      lng: pendingPin.lng,
      radiusKm,
      label: pendingPin.label,
    };
    onChange([...locations, newLocation]);
    setPendingPin(null);
    setSearchQuery("");
    setRadiusKm(10);
  }

  function removeLocation(index: number) {
    onChange(locations.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={
            missingToken
              ? "Location search is unavailable right now"
              : isInitializingMap
                ? "Loading map..."
                : "Search for a city or address..."
          }
          autoComplete="off"
          disabled={searchDisabled}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {showDropdown && searchResults.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {searchResults.map((feature) => (
              <li key={feature.id}>
                <button
                  type="button"
                  onMouseDown={() => selectSearchResult(feature)}
                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {feature.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
          {errorMessage}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className={`w-full h-[400px] rounded-lg border border-border overflow-hidden ${
            !mapLoaded ? "bg-muted/30" : ""
          }`}
        />
        {!mapLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-border bg-background/90 p-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium text-foreground">
                {isInitializingMap ? "Loading Mapbox map..." : "Map unavailable"}
              </p>
              <p className="text-sm text-muted-foreground">
                {missingToken
                  ? "Location targeting is temporarily unavailable."
                  : errorMessage ??
                    "The map could not load. Check the token and your Mapbox URL restrictions."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Radius slider (only when pending pin exists) */}
      {pendingPin && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Radius</p>
            <span className="text-sm font-medium text-foreground">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>100 km</span>
          </div>
          <button
            type="button"
            onClick={addLocation}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add Location
          </button>
        </div>
      )}

      {/* Saved locations list */}
      {locations.length === 0 && !pendingPin ? (
        <p className="text-sm text-muted-foreground">
          No locations added. Search or click the map to add target areas.
        </p>
      ) : locations.length > 0 ? (
        <ul className="space-y-2">
          {locations.map((loc, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{loc.label}</p>
                  <p className="text-xs text-muted-foreground">{loc.radiusKm} km radius</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeLocation(i)}
                aria-label={`Remove ${loc.label}`}
                className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-error hover:bg-error/10 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
