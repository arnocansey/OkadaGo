import PassengerApp from "./src/PassengerApp";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <PassengerApp />
    </SafeAreaProvider>
  );
}
