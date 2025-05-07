import Layout from "./Layout.jsx";

import Home from "./Home";
import LandingBio from "./LandingBio";
import Catalogo from "./Catalogo";
import ProdutoDetalhe from "./ProdutoDetalhe";
import Admin from "./Admin";
import Contato from "./Contato";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    LandingBio: LandingBio,
    Home: Home,
    Catalog: Catalogo,  // Renomeado para manter em inglês como os outros
    ProdutoDetalhe: ProdutoDetalhe,
    Admin: Admin,
    Contato: Contato
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Nova página inicial no estilo Bio/LinkTree */}
                <Route path="/" element={<LandingBio />} />
                
                {/* Página de catálogo anterior, agora movida para rotas específicas */}
                <Route path="/home" element={<Home />} />
                <Route path="/catalog" element={<Catalogo />} />
                
                {/* Outras rotas */}
                <Route path="/produto" element={<ProdutoDetalhe />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/contato" element={<Contato />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}