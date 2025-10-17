import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { AppProviders } from './AppProviders';

import MainComponent from './MainComponent';
import PhaserDemo from './phaser/PhaserDemo';

export default function App() {
  return (
    <>
      <AppProviders>
            <Router>
              <Routes>
                <Route path="/" element={<MainComponent />} />
                <Route path="/phaser" element={<PhaserDemoPage />} />
              </Routes>
            </Router>
      </AppProviders>
    </>
  );
}

// Wrapper to provide navigation to PhaserDemo
function PhaserDemoPage() {
  const navigate = useNavigate();
  return <PhaserDemo onBack={() => navigate('/')} />;
}
