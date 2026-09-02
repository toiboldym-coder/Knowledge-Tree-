import { AtlasProvider } from "./state/AtlasContext";
import { AppShell } from "./components/AppShell";

export function App() {
  return (
    <AtlasProvider>
      <div className="grain" />
      <AppShell />
    </AtlasProvider>
  );
}
