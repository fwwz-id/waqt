import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, LocateFixed, Loader2, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getCurrentCoords,
  GeolocationError,
} from "@/lib/location/geolocation";
import {
  reverseGeocode,
  searchCities,
  searchResultToLocation,
  type CitySearchResult,
} from "@/lib/location/nominatim";
import type { LocationConfig } from "@/types";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

type Props = {
  current?: LocationConfig;
  onSelect: (location: LocationConfig) => void;
};

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function LocationPicker({ current, onSelect }: Props) {
  const { t } = useT();
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [gpsError, setGpsError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounced(query);

  const {
    data: results = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["city-search", debouncedQuery],
    queryFn: ({ signal }) => searchCities(debouncedQuery, signal),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const useGps = async () => {
    setGpsError(null);
    setGpsLoading(true);
    try {
      const coords = await getCurrentCoords();
      const location = await reverseGeocode(coords.lat, coords.lng);
      onSelect(location);
    } catch (err) {
      setGpsError(
        err instanceof GeolocationError
          ? t.location.geo[err.kind]
          : t.location.gpsFallback,
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const pickCity = (r: CitySearchResult) => {
    onSelect(searchResultToLocation(r));
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={useGps}
        disabled={gpsLoading}
        className="w-full"
        size="lg"
      >
        {gpsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="h-4 w-4" />
        )}
        {t.location.useCurrent}
      </Button>

      {gpsError && (
        <Alert variant="warning">
          <AlertDescription>{gpsError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t.common.or}
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.location.searchPlaceholder}
          className="pl-9"
          inputMode="search"
          autoComplete="off"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isError && (
        <Alert variant="warning">
          <AlertDescription>{t.location.searchFailed}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border/70 bg-card">
          {results.map((r) => {
            const selected =
              current &&
              Math.abs(current.lat - r.lat) < 1e-4 &&
              Math.abs(current.lng - r.lng) < 1e-4;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pickCity(r)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                    selected && "bg-accent",
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate">{r.label}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {debouncedQuery.trim().length >= 2 &&
        !isFetching &&
        results.length === 0 &&
        !isError && (
          <p className="px-1 text-sm text-muted-foreground">
            {t.location.noResults(debouncedQuery)}
          </p>
        )}
    </div>
  );
}
