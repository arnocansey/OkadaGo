import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

type Props = {
  /** Called once the animation has fully played and the overlay has faded out. */
  onFinish: () => void;
};

const splashLogo = require("../../assets/branding/okadago-logo-splash.png");

// Animation timings (total ~1.25s: 550ms fade/scale + 350ms hold + 350ms exit)
const FADE_IN_DURATION = 550;
const HOLD_DURATION = 350;
const FADE_OUT_DURATION = 350;

/**
 * OkadaGo Minimalist Premium Splash Screen.
 *
 * Clean pure white background (#FFFFFF) with the prominent centered OkadaGo
 * initials/logo (#153252 Blue and #FF6A00 Orange), featuring a subtle,
 * professional fade-in and scale-up animation, brief hold, and smooth fade-out
 * into the Passenger Home Screen.
 */
export function AnimatedSplash({ onFinish }: Props) {
  const { width } = useWindowDimensions();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const animation = Animated.sequence([
      // 1. Logo gently fades in and slightly scales up (0.92 -> 1.0)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: FADE_IN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: FADE_IN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 2. Hold briefly
      Animated.delay(HOLD_DURATION),
      // 3. Smooth fade-out reveal into the app
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) finish();
    });

    // Safety net: guarantee the app is revealed even if interrupted
    const timeout = setTimeout(finish, FADE_IN_DURATION + HOLD_DURATION + FADE_OUT_DURATION + 800);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [containerOpacity, logoOpacity, logoScale, onFinish]);

  // Responsive logo sizing maintaining the ~1.42:1 aspect ratio with generous white space
  const logoWidth = Math.min(Math.round(width * 0.56), 230);
  const logoHeight = Math.round(logoWidth * 0.7);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: containerOpacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={splashLogo}
          style={{ width: logoWidth, height: logoHeight, resizeMode: "contain" }}
          accessibilityLabel="OkadaGo"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
