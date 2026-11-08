import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { PrefsProvider } from "./context/Prefs";
import { ArticlePage } from "./pages/Article";
import { CheckccPage } from "./pages/Checkcc";
import { ClaudeColumnPage } from "./pages/ClaudeColumn";
import { DisclaimerPage } from "./pages/Disclaimer";
import { FingerprintPage } from "./pages/Fingerprint";
import { HomePage } from "./pages/Home";
import { PartnersPage } from "./pages/Partners";
import { ShopPage } from "./pages/Shop";
import { WorthPage } from "./pages/Worth";

export default function App() {
  return (
    <PrefsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="worth" element={<WorthPage />} />
            <Route path="recommend" element={<Navigate to="/worth" replace />} />
            <Route path="claude" element={<ClaudeColumnPage tab="articles" />} />
            <Route path="claude/brief" element={<ClaudeColumnPage tab="brief" />} />
            <Route path="claude/brief/:date" element={<ClaudeColumnPage tab="brief" />} />
            <Route path="claude/github" element={<Navigate to="/claude/brief" replace />} />
            <Route path="claude/launch" element={<Navigate to="/claude/brief" replace />} />
            <Route path="nodes" element={<Navigate to="/checkcc" replace />} />
            <Route path="fingerprint" element={<FingerprintPage />} />
            <Route path="checkcc" element={<CheckccPage />} />
            <Route path="articles" element={<Navigate to="/claude" replace />} />
            <Route path="articles/:id" element={<ArticlePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="disclaimer" element={<DisclaimerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PrefsProvider>
  );
}
