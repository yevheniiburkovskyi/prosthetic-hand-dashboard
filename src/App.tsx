import { Link, Route, Routes } from 'react-router-dom';

const App = () => {
  return (
    <div className="bg-background min-h-screen">
      <nav className="flex gap-4 border-b p-4">
        <Link to="/" className="hover:text-primary">
          Dashboard
        </Link>
        <Link to="/settings" className="hover:text-primary">
          Settings
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<div>dashboard</div>} />
        <Route path="/settings" element={<div>settings</div>} />
      </Routes>
    </div>
  );
};

export default App;
