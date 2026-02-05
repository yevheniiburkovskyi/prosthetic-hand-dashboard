import { Route, Routes } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu';

const App = () => {
  return (
    <main className="bg-background flex min-h-screen gap-8">
      <NavigationMenu />

      <section className="p-8">
        <Routes>
          <Route path="/" element={<div>Overview</div>} />
          <Route path="/temperature" element={<div>Temperature</div>} />
          <Route path="/fsr-sensor" element={<div>FSR Sensor</div>} />
          <Route path="/vibration" element={<div>Vibration</div>} />
          <Route path="/heating" element={<div>Heating</div>} />
        </Routes>
      </section>
    </main>
  );
};

export default App;
