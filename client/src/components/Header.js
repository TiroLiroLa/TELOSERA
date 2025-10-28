import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import searchIcon from '../assets/icon.png';


const Header = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.append('q', searchTerm.trim());
        }
        if (searchType) {
            params.append('tipo', searchType);
        }

        navigate(`/busca?${params.toString()}`);
    };

    return (
        <header className="main-header">
            <div className="header-left">
                <Link to="/" className="logo">
                    TELOSERA
                </Link>

                <form onSubmit={handleSearch} className="search-bar-placeholder">
                    <div className="search-select-wrapper">
                        <select 
                            className="search-type-select" 
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="O">Vagas</option>
                            <option value="S">Serviços</option>
                        </select>
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit">
                        <img src={searchIcon} alt="Buscar" />
                    </button>
                </form>
            </div>

            <div className="header-right">
                <nav className="main-nav">
                    <Link to="/anuncios/criar" className="nav-button publish-button">
                        Publicar Anúncio
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="nav-link">Meus Anúncios</Link>
                            <Link to={`/perfil/${user?.id_usuario}`} className="avatar-menu">
                                <div className="avatar-placeholder">
                                    {user ? user.nome.charAt(0).toUpperCase() : '?'}
                                </div>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Entrar</Link>
                            <Link to="/cadastro" className="nav-button">Cadastre-se</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;