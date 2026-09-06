import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Marker } from "react-native-maps";
import { MotorcycleMarker } from "./MotorcycleMarker";

type Props = {
  id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  pinColor?: string;
  title?: string;
  etaLabel?: string;
  isSelected?: boolean;
  onPress?: (id: string) => void;
};

/**
 * AnimatedMotorcycleMarker — Smoothly interpolates between GPS positions
 * and rotates the motorcycle icon to match travel direction.
 * Prevents jarring jumps and marker flickering between location updates.
 */
export function AnimatedMotorcycleMarker({
  id,
  latitude,
  longitude,
  heading = 0,
  speed = 0,
  pinColor,
  title,
  etaLabel,
  isSelected,
  onPress,
}: Props) {
  const animLat = useRef(new Animated.Value(latitude)).current;
  const animLng = useRef(new Animated.Value(longitude)).current;
  const animHeading = useRef(new Animated.Value(heading)).current;
  const prevHeading = useRef(heading);
  const markerRef = useRef<React.ComponentRef<typeof Marker>>(null);
  const hasInitialPosition = useRef(false);

  // Calculate heading from GPS deltas when heading is 0 or unavailable
  const calculatedHeading = useRef(heading);
  const prevLat = useRef(latitude);
  const prevLng = useRef(longitude);

  useEffect(() => {
    const deltaLat = latitude - prevLat.current;
    const deltaLng = longitude - prevLng.current;

    // Only calculate heading if there's meaningful movement
    if (Math.abs(deltaLat) > 0.00001 || Math.abs(deltaLng) > 0.00001) {
      const bearing = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
      const compassHeading = (bearing + 360) % 360;
      calculatedHeading.current = compassHeading;
    }

    prevLat.current = latitude;
    prevLng.current = longitude;
  }, [latitude, longitude]);

  useEffect(() => {
    const targetHeading = heading || calculatedHeading.current;

    if (!hasInitialPosition.current) {
      // First render: set immediately without animation
      animLat.setValue(latitude);
      animLng.setValue(longitude);
      animHeading.setValue(targetHeading);
      hasInitialPosition.current = true;
      prevHeading.current = targetHeading;
      return;
    }

    // Smoothly interpolate position with spring animation
    // Faster spring for short moves (< 50m), slower for longer moves
    const distDelta = Math.abs(latitude - prevLat.current) + Math.abs(longitude - prevLng.current);
    const isLongDistance = distDelta > 0.0005; // ~50m

    Animated.parallel([
      Animated.spring(animLat, {
        toValue: latitude,
        useNativeDriver: false,
        tension: isLongDistance ? 35 : 50,
        friction: isLongDistance ? 7 : 9,
      }),
      Animated.spring(animLng, {
        toValue: longitude,
        useNativeDriver: false,
        tension: isLongDistance ? 35 : 50,
        friction: isLongDistance ? 7 : 9,
      }),
    ]).start();

    // Smooth heading rotation with wrap-around handling
    let target = targetHeading;
    const prev = prevHeading.current;
    const diff = target - prev;

    if (diff > 180) {
      target = prev + (diff - 360);
    } else if (diff < -180) {
      target = prev + (diff + 360);
    }

    Animated.spring(animHeading, {
      toValue: target,
      useNativeDriver: false,
      tension: 30,
      friction: 7,
    }).start();

    prevHeading.current = target;
  }, [latitude, longitude, heading]);

  // Use setNativeProps for smooth marker position updates without re-render
  useEffect(() => {
    if (markerRef.current) {
      const currentHeading = heading || calculatedHeading.current;
      markerRef.current.setNativeProps({
        coordinate: { latitude, longitude },
        rotation: currentHeading,
      });
    }
  }, [latitude, longitude, heading]);

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={heading || calculatedHeading.current}
      tracksViewChanges={false}
      onPress={() => onPress?.(id)}
    >
      <MotorcycleMarker
        heading={heading || calculatedHeading.current}
        disableRotation
        isSelected={isSelected}
        isMoving={speed > 1}
        pinColor={pinColor}
        title={title}
        speed={speed}
        etaLabel={etaLabel}
      />
    </Marker>
  );
}
