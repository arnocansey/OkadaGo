import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

type Props = {
  /** Called once the white splash display sequence finishes. */
  onFinish: () => void;
};

const splashLogo = require("../../assets/branding/okadago-icon-yellow.png");

const FADE_IN_MS = 450;
const HOLD_MS = 600;
const FADE_OUT_MS = 300;

/**
 * OkadaGo Blue Initial Splash Screen.
 *
 * Screen 1 of launch sequence:
 * - Brand blue background (#153252)
 * - Centered OkadaGo icon/initials
 * - Smooth entry, hold, and transition into the motorcycle animation
 */
export function WhiteSplashScreen({ onFinish }: Props) {
  const { width } = useWindowDimensions();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) finish();
    });

    const timeout = setTimeout(finish, FADE_IN_MS + HOLD_MS + FADE_OUT_MS + 600);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [containerOpacity, logoOpacity, logoScale, onFinish]);

  const logoWidth = Math.min(Math.round(width * 0.38), 140);
  const logoHeight = logoWidth;

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
    backgroundColor: "#153252",
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
