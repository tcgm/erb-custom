import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { AppProviders } from './AppProviders';

import MainComponent from './MainComponent';

export default function App() {
  return (
    <>
      <AppProviders>
            <Router>
              <Routes>
                <Route path="/" element={<MainComponent />} />
              </Routes>
            </Router>
      </AppProviders>
    </>
  );
}
