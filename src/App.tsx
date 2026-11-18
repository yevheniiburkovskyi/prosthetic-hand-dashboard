import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import NavigationMenu from './components/NavigationMenu';
import Temperature from './pages/Temperature';
import FSR from './pages/FSR';

const App = () => {
  return (
    <main className="bg-background flex h-screen">
      <NavigationMenu />

      <section className="flex h-full w-full flex-col gap-10">
        <Routes>
          <Route path="/temperature" element={<Temperature />} />
          <Route path="/fsr" element={<FSR />} />
          <Route path="*" element={<Navigate to="/temperature" replace />} />
        </Routes>
      </section>

      <Toaster />
    </main>
  );
};

export default App;
