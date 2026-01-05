import { MenuBar } from "@/components/layout/MenuBar";
import { ToolBar } from "@/components/layout/ToolBar";
import { MainArea } from "@/components/layout/MainArea";
import { StatusBar } from "@/components/layout/StatusBar";
import { useWebSocket, useDataFetch } from "@/hooks/useWebSocket";
import "./App.css";

function App() {
  useWebSocket();
  useDataFetch();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <MenuBar />
      <ToolBar />
      <MainArea />
      <StatusBar />
    </div>
  );
}

export default App;
