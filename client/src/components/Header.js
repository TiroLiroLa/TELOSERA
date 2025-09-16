import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';
import searchIcon from '../assets/icon.png';


const Header = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/busca?q=${searchTerm}`);
    };

    return (
        <header className="main-header">
            <div className="header-left">
                <Link to="/" className="logo">
                    TELOSERA
                </Link>

                <form onSubmit={handleSearch} className="search-bar-placeholder">
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