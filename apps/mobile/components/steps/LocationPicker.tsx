import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView as RNScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Coordinates, LocationData } from '@guidenav/types';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '@/lib/google-maps';

const DEFAULT_CENTER: Coordinates = { latitude: 25.2048, longitude: 55.2708 };
const DEFAULT_ZOOM_DELTA = 0.01;
const PINNED_ZOOM_DELTA = 0.003;

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (data: LocationData | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  defaultCenter?: Coordinates;
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ formattedAddress: string; placeId?: string }> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${getGoogleMapsApiKey()}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.[0]) {
      return {
        formattedAddress: data.results[0].formatted_address,
        placeId: data.results[0].place_id,
      };
    }
  } catch {
    // fall through
  }
  return { formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
}

async function searchPlaces(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': getGoogleMapsApiKey(),
        },
        body: JSON.stringify({ input: query }),
      },
    );
    const data = await res.json();
    if (!data.suggestions) return [];
    return data.suggestions
      .filter((s: any) => s.placePrediction)
      .map((s: any) => ({
        placeId: s.placePrediction.placeId,
        mainText: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text?.text ?? '',
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
      }));
  } catch {
    return [];
  }
}

async function getPlaceDetails(
  placeId: string,
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': getGoogleMapsApiKey(),
          'X-Goog-FieldMask': 'location,formattedAddress,displayName',
        },
      },
    );
    const data = await res.json();
    if (data.location) {
      return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        formattedAddress: data.formattedAddress ?? data.displayName?.text ?? '',
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
  label = 'Drop-off Location',
  placeholder = 'Search for the delivery address...',
  defaultCenter = DEFAULT_CENTER,
}: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextMapPressRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [markerCoord, setMarkerCoord] = useState<Coordinates | null>(
    value?.coordinates ?? null,
  );

  const [searchText, setSearchText] = useState(value?.formattedAddress ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const isConfigured = isGoogleMapsConfigured();

  useEffect(() => {
    if (value?.coordinates) {
      setMarkerCoord(value.coordinates);
    }
  }, [value]);

  const animateToCoord = useCallback((coord: Coordinates) => {
    mapRef.current?.animateToRegion(
      {
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: PINNED_ZOOM_DELTA,
        longitudeDelta: PINNED_ZOOM_DELTA,
      },
      300,
    );
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSearchLoading(true);
      debounceRef.current = setTimeout(async () => {
        const results = await searchPlaces(text);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSearchLoading(false);
      }, 300);
    },
    [],
  );

  const handleSuggestionPress = useCallback(
    async (suggestion: Suggestion) => {
      ignoreNextMapPressRef.current = true;
      setShowSuggestions(false);
      setSuggestions([]);
      Keyboard.dismiss();
      setSearchText(suggestion.mainText);

      const details = await getPlaceDetails(suggestion.placeId);
      if (!details) return;

      const coord: Coordinates = { latitude: details.lat, longitude: details.lng };
      setMarkerCoord(coord);
      animateToCoord(coord);
      setSearchText(details.formattedAddress);

      onChange({
        coordinates: coord,
        formattedAddress: details.formattedAddress,
        placeId: suggestion.placeId,
      });
    },
    [onChange, animateToCoord],
  );

  const handleMapPress = useCallback(
    async (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      if (ignoreNextMapPressRef.current) {
        ignoreNextMapPressRef.current = false;
        return;
      }
      if (disabled) return;
      Keyboard.dismiss();
      setShowSuggestions(false);
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const coord: Coordinates = { latitude, longitude };
      setMarkerCoord(coord);
      animateToCoord(coord);

      const geo = await reverseGeocode(latitude, longitude);
      onChange({ coordinates: coord, ...geo });
      setSearchText(geo.formattedAddress);
    },
    [disabled, onChange, animateToCoord],
  );

  const handleMarkerDragEnd = useCallback(
    async (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const coord: Coordinates = { latitude, longitude };
      setMarkerCoord(coord);

      const geo = await reverseGeocode(latitude, longitude);
      onChange({ coordinates: coord, ...geo });
      setSearchText(geo.formattedAddress);
    },
    [onChange],
  );

  const handleGps = useCallback(async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow location access in your device settings to use this feature.',
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coord: Coordinates = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMarkerCoord(coord);
      animateToCoord(coord);

      const geo = await reverseGeocode(coord.latitude, coord.longitude);
      onChange({ coordinates: coord, ...geo });
      setSearchText(geo.formattedAddress);
    } catch {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setLoadingGps(false);
    }
  }, [onChange, animateToCoord]);

  const handleClear = useCallback(() => {
    onChange(null);
    setMarkerCoord(null);
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
    mapRef.current?.animateToRegion(
      {
        latitude: defaultCenter.latitude,
        longitude: defaultCenter.longitude,
        latitudeDelta: DEFAULT_ZOOM_DELTA,
        longitudeDelta: DEFAULT_ZOOM_DELTA,
      },
      300,
    );
  }, [onChange, defaultCenter]);

  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <View style={styles.errorContainer}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#dc2626" strokeWidth={2} />
            <Path d="M12 7v6M12 16v1" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.errorText}>Google Maps API key is not configured</Text>
          <Text style={styles.errorHint}>
            Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in apps/mobile/.env (or as an EAS secret) and rebuild the app.
          </Text>
        </View>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: value?.coordinates?.latitude ?? defaultCenter.latitude,
    longitude: value?.coordinates?.longitude ?? defaultCenter.longitude,
    latitudeDelta: value ? PINNED_ZOOM_DELTA : DEFAULT_ZOOM_DELTA,
    longitudeDelta: value ? PINNED_ZOOM_DELTA : DEFAULT_ZOOM_DELTA,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label.toUpperCase()} <Text style={styles.required}>*</Text>
      </Text>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.autocompleteWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            editable={!disabled}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          {searchText.length > 0 && !searchLoading && (
            <Pressable
              style={styles.searchClear}
              onPress={handleClear}
              hitSlop={6}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Pressable>
          )}
          {searchLoading && (
            <ActivityIndicator
              size="small"
              color="#9ca3af"
              style={styles.searchSpinner}
            />
          )}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              <RNScrollView
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
              >
                {suggestions.map((item, idx) => (
                  <React.Fragment key={item.placeId}>
                    {idx > 0 && <View style={styles.suggestionSep} />}
                    <Pressable
                      style={styles.suggestionRow}
                      onPress={() => handleSuggestionPress(item)}
                    >
                      <Text style={styles.suggestionMain} numberOfLines={1}>
                        {item.mainText}
                      </Text>
                      {!!item.secondaryText && (
                        <Text style={styles.suggestionSecondary} numberOfLines={1}>
                          {item.secondaryText}
                        </Text>
                      )}
                    </Pressable>
                  </React.Fragment>
                ))}
              </RNScrollView>
            </View>
          )}
        </View>
        <Pressable
          style={[styles.gpsButton, (disabled || loadingGps) && styles.gpsButtonDisabled]}
          onPress={handleGps}
          disabled={disabled || loadingGps}
        >
          {loadingGps ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={3} stroke="#6b7280" strokeWidth={2} />
              <Path
                d="M12 2v2M12 20v2M2 12h2M20 12h2"
                stroke="#6b7280"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={12} cy={12} r={8} stroke="#6b7280" strokeWidth={2} />
            </Svg>
          )}
        </Pressable>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          scrollEnabled={!disabled}
          zoomEnabled={!disabled}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {markerCoord && (
            <Marker
              coordinate={markerCoord}
              draggable={!disabled}
              onDragEnd={handleMarkerDragEnd}
              pinColor="#2c3e50"
            />
          )}
        </MapView>

        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2c3e50" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}

        {mapReady && !markerCoord && (
          <View style={styles.hintOverlay} pointerEvents="none">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13C3 5.03 7.03 1 12 1s9 4.03 9 9z"
                stroke="#2c3e50"
                strokeWidth={2}
              />
              <Circle cx={12} cy={10} r={3} stroke="#2c3e50" strokeWidth={2} />
            </Svg>
            <Text style={styles.hintText}>
              Search for an address or tap on the map to drop a pin
            </Text>
          </View>
        )}
      </View>

      {/* Selected location card */}
      {value && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedInfo}>
            <Svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginTop: 2, flexShrink: 0 } as any}
            >
              <Path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13C3 5.03 7.03 1 12 1s9 4.03 9 9z"
                stroke="#2c3e50"
                strokeWidth={2}
              />
              <Circle cx={12} cy={10} r={3} stroke="#2c3e50" strokeWidth={2} />
            </Svg>
            <View style={styles.selectedText}>
              <Text style={styles.selectedAddress}>{value.formattedAddress}</Text>
              <Text style={styles.selectedCoords}>
                {value.coordinates.latitude.toFixed(6)},{' '}
                {value.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          {!disabled && (
            <Pressable style={styles.clearButton} onPress={handleClear} hitSlop={8}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  required: {
    color: '#ef4444',
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  autocompleteWrapper: {
    flex: 1,
    zIndex: 10,
  },
  searchInput: {
    height: 48,
    paddingHorizontal: 16,
    paddingRight: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  searchClear: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  searchSpinner: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 220,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  suggestionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  suggestionSecondary: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  suggestionSep: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },

  // GPS button
  gpsButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },

  // Map
  mapWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: 280,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // Hint
  hintOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },

  // Selected card
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  selectedText: {
    flex: 1,
    gap: 4,
  },
  selectedAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  selectedCoords: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },

  // Error
  errorContainer: {
    height: 280,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
