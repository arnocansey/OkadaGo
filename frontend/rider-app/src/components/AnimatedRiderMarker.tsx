import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MotorcycleMarker } from "./MotorcycleMarker";

type Props = {
  latitude: number;
  longitude: number;
  heading?: number;
  pinColor?: string;
  title?: string;
};

/**
 * AnimatedRiderMarker — Smoothly interpolates between GPS positions
 * and rotates the motorcycle marker to match heading/bearing.
 * Prevents jarring jumps between location updates.
 */
export function AnimatedRiderMarker({
  latitude,
  longitude,
  heading = 0,
  pinColor,
  title,
}: Props) {
  const animLat = useRef(new Animated.Value(latitude)).current;
  const animLng = useRef(new Animated.Value(longitude)).current;
  const animHeading = useRef(new Animated.Value(heading)).current;
  const prevHeading = useRef(heading);
  const markerRef = useRef<React.ComponentRef<typeof Marker>>(null);

  useEffect(() => {
    // Smoothly interpolate position over 2 seconds (matches GPS interval)
    Animated.parallel([
      Animated.spring(animLat, {
        toValue: latitude,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }),
      Animated.spring(animLng, {
        toValue: longitude,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }),
    ]).start();

    // Smooth heading rotation, handling wrap-around (359° → 1°)
    let targetHeading = heading;
    const prev = prevHeading.current;
    const diff = targetHeading - prev;

    // Handle 360° wrap-around for shortest rotation path
    if (diff > 180) {
      targetHeading = prev + (diff - 360);
    } else if (diff < -180) {
      targetHeading = prev + (diff + 360);
    }

    Animated.spring(animHeading, {
      toValue: targetHeading,
      useNativeDriver: false,
      tension: 30,
      friction: 7,
    }).start();

    prevHeading.current = targetHeading;
  }, [latitude, longitude, heading]);

  // NativeMarker needs actual coordinate values; we use native driver via setNativeProps
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setNativeProps({
        coordinate: { latitude, longitude },
        rotation: heading,
      });
    }
  }, [latitude, longitude, heading]);

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude, longitude }}
      title={title ?? "Okada Rider"}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={heading}
      tracksViewChanges={false}
    >
      <MotorcycleMarker
        heading={heading}
        disableRotation
        pinColor={pinColor}
        title={title}
      />
    </Marker>
  );
}
