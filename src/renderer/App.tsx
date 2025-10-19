import './App.css';
import { AppProviders } from './AppProviders';
import MainComponent from './MainComponent';

export default function App() {
  return (
    <AppProviders>
      <MainComponent />
    </AppProviders>
  );
}
