import { Route, Routes } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu';
import Temperature from './pages/Temperature';
import FSR from './pages/FSR';

const App = () => {
  return (
    <main className="bg-background flex h-screen">
      <NavigationMenu />

      <section className="flex h-full w-full flex-col gap-10">
        <Routes>
          <Route path="/" element={<div>Overview</div>} />
          <Route path="/temperature" element={<Temperature />} />
          <Route path="/fsr" element={<FSR />} />
          <Route path="/vibration" element={<div>Vibration</div>} />
          <Route path="/heating" element={<div>Heating</div>} />
        </Routes>
      </section>
    </main>
  );
};

export default App;
