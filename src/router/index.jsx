import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home.jsx';

/**
 * Application router. For the MVP we only have a single page, but
 * separating routes allows easy expansion later (e.g. product details,
 * admin screen, etc.).
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}