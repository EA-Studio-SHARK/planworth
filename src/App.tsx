import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ArticlePage } from "./pages/Article";
import { ArticlesPage } from "./pages/Articles";
import { ComparePage } from "./pages/Compare";
import { RecommendPage } from "./pages/Recommend";
import { ShopPage } from "./pages/Shop";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<ComparePage />} />
          <Route path="recommend" element={<RecommendPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/:id" element={<ArticlePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
