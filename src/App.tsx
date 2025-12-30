import { MenuBar } from "@/components/layout/MenuBar";
import { ToolBar } from "@/components/layout/ToolBar";
import { MainArea } from "@/components/layout/MainArea";
import { StatusBar } from "@/components/layout/StatusBar";
import { useWebSocket, useDataFetch } from "@/hooks/useWebSocket";
import "./App.css";

function App() {
  // Initialize WebSocket connection
  useWebSocket();
  
  // Fetch initial data when connected
  useDataFetch();

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-primary)]">
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Tool Bar */}
      <ToolBar />
      
      {/* Main Content Area */}
      <MainArea />
      
      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
