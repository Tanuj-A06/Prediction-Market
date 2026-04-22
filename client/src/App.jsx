// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MarketDetail } from './pages/MarketDetail';
import { Portfolio } from './pages/Portfolio';
import { CreateMarket } from './pages/CreateMarket';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { useUserStore } from './store/useUserStore';

function App() {
  const restoreSession = useUserStore(state => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="markets" element={<Home />} />
          <Route path="market/:id" element={<MarketDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="create" element={<CreateMarket />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
