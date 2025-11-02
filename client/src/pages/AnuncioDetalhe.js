import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AnuncioDetalhe.css';
import Modal from '../components/Modal';
import MoveableMap from '../components/MoveableMap';
import mapPinIcon from '../assets/map-pin.svg';
import StarRating from '../components/StarRating';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const AnuncioDetalhe = () => {
    const { id: idAnuncio } = useParams();
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const { isAuthenticated, user, loading: authLoading } = useContext(AuthContext);
    const [anuncio, setAnuncio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [statusCandidatura, setStatusCandidatura] = useState({
        carregando: true,
        candidatado: false,
        mensagem: ''
    });

    useEffect(() => {
        const fetchDados = async () => {
            try {
                setLoading(true);
                setStatusCandidatura(prev => ({ ...prev, carregando: true }));

                let params = new URLSearchParams();
                if (isAuthenticated) {
                    try {
                        const resRegiao = await axios.get('/api/users/me/regiao').catch(() => null);
                        const { lat, lng } = resRegiao.data;
                        params.append('lat', lat);
                        params.append('lng', lng);
                    } catch (error) {
                        console.log("Usuário sem região, não será possível calcular a distância.");
                    }
                }

                const res = await axios.get(`/api/anuncios/${idAnuncio}?${params.toString()}`);
                setAnuncio(res.data);

                if (isAuthenticated) {
                    const resCandidatura = await axios.get(`/api/anuncios/${idAnuncio}/verificar-candidatura`);
                    if (resCandidatura.data.candidatado) {
                        setStatusCandidatura({ carregando: false, candidatado: true, mensagem: 'Candidatura Enviada' });
                    } else {
                        setStatusCandidatura({ carregando: false, candidatado: false, mensagem: '' });
                    }
                } else {
                    setStatusCandidatura({ carregando: false, candidatado: false, mensagem: '' });
                }
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setStatusCandidatura({ carregando: false, candidatado: false, mensagem: 'Erro ao carregar dados.' });
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) {
            fetchDados();
        }
    }, [idAnuncio, isAuthenticated, authLoading]);

    const formatDistance = (distanceMeters) => {
        if (!distanceMeters) return null;
        const distanceKm = distanceMeters / 1000;
        if (distanceKm < 1) {
            return `${Math.round(distanceMeters)} m de você`;
        }
        return `~${distanceKm.toFixed(1)} km de você`;
    };

    const handleCandidatar = async () => {
        setStatusCandidatura({ ...statusCandidatura, carregando: true });
        try {
            const res = await axios.post(`/api/anuncios/${idAnuncio}/candidatar`);
            setStatusCandidatura({
                candidatado: true,
                mensagem: res.data.msg,
                carregando: false
            });
        } catch (err) {
            setStatusCandidatura({
                candidatado: false,
                mensagem: err.response?.data?.msg || 'Erro ao se candidatar.',
                carregando: false
            });
        }
    };

    if (loading || authLoading) return <div className="container">Carregando...</div>;
    if (!anuncio) return <div className="container">Anúncio não encontrado ou indisponível.</div>;
    const distanciaFormatada = formatDistance(anuncio.distancia);

    const isOwner = user?.id_usuario === anuncio?.id_publicador;

    const renderActionButton = () => {
        if (!isAuthenticated) {
            return (
                <Link to="/login" className="btn btn-primary btn-cta">
                    Faça login para se candidatar
                </Link>
            );
        }
        if (isOwner) {
            return <button className="btn btn-secondary btn-cta" disabled>Você é o dono deste anúncio</button>;
        }
        if (statusCandidatura.candidatado) {
            return <button className="btn btn-success btn-cta" disabled>{statusCandidatura.mensagem}</button>;
        }
        return (
            <button
                onClick={handleCandidatar}
                className="btn btn-primary btn-cta"
                disabled={statusCandidatura.carregando}
            >
                {statusCandidatura.carregando ? 'Enviando...' : 'Candidatar-se'}
            </button>
        );
    };

    const dataServicoFormatada = new Date(anuncio.data_servico).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const postadoEm = new Date(anuncio.data_publicacao).toLocaleDateString('pt-BR');

    const lightboxImages = anuncio.imagens?.map(img => ({
        src: `http://localhost:3001${img.caminho_imagem}`
    })) || [];

    const displayImages = anuncio.imagens ? anuncio.imagens.slice(0, 3) : [];
    const remainingImagesCount = anuncio.imagens ? Math.max(0, anuncio.imagens.length - 3) : 0;

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    return (
        <>
            <div className="anuncio-detalhe-page">
                <main className="anuncio-main">
                    <div className="anuncio-header">
                        <h1>{anuncio.titulo}</h1>
                        {displayImages.length > 0 && (
                            <div className="image-gallery">
                                {displayImages.map((img, index) => {
                                    const isThirdImageWithMore = index === 2 && remainingImagesCount > 0;
                                    const wrapperClass = `gallery-image-wrapper ${isThirdImageWithMore ? 'has-more-images' : ''}`;
                                    const moreCount = `+${remainingImagesCount}`;

                                    return (
                                        <div
                                            key={img.id_imagem}
                                            className={wrapperClass}
                                            {...(isThirdImageWithMore && { 'data-more-count': moreCount })}
                                            onClick={() => openLightbox(index)}
                                        >
                                            <img
                                                src={`http://localhost:3001${img.caminho_imagem}`}
                                                alt={`Imagem ${index + 1} do anúncio`}
                                                className="gallery-image"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="anuncio-subheader">
                            Postado por <Link to={`/perfil/${anuncio.id_publicador}`}>{anuncio.nome_usuario}</Link> em {postadoEm}
                            {anuncio.nome_cidade && (
                                <>
                                    {' - '}
                                    <a href="#" onClick={(e) => { e.preventDefault(); setMapModalOpen(true); }}>
                                        {anuncio.nome_cidade}, {anuncio.uf_estado} 📍
                                    </a>
                                </>
                            )}
                            {distanciaFormatada && (
                                <span className="card-location-tag" style={{ marginLeft: '1rem' }}>
                                    <img src={mapPinIcon} alt="Ícone de localização" />
                                    <span>{distanciaFormatada}</span>
                                </span>
                            )}
                        </p>
                    </div>

                    <section className="anuncio-section">
                        <h2>Descrição</h2>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem' }}>{anuncio.descricao}</pre>
                    </section>

                    <section className="anuncio-section">
                        <h2>Detalhes do Serviço</h2>
                        <ul className="details-list">
                            <li>
                                <strong>Data de Início</strong>
                                {dataServicoFormatada}
                            </li>
                            <li>
                                <strong>Tipo de Anúncio</strong>
                                {anuncio.tipo === 'O' ? 'Oferta de Vaga' : 'Oferta de Serviço'}
                            </li>
                            <li>
                                <strong>Especialização</strong>
                                {anuncio.nome_area}
                            </li>
                            <li>
                                <strong>Serviço Principal</strong>
                                {anuncio.nome_servico}
                            </li>
                        </ul>
                    </section>
                </main>

                <aside className="anuncio-sidebar">
                    <div className="info-box">
                        <div className="profile-avatar-small">
                            {anuncio.nome_usuario.charAt(0).toUpperCase()}
                        </div>
                        <h3>{anuncio.tipo === 'O' ? 'Contratante' : 'Prestador'}</h3>
                        <p>{anuncio.nome_usuario}</p>

                        {anuncio.avaliacao && (
                            <div className="sidebar-rating">
                                <StarRating rating={anuncio.avaliacao.media_geral} />
                                <span> ({anuncio.avaliacao.total_avaliacoes})</span>
                            </div>
                        )}

                        {isAuthenticated && (
                            <div className="contact-details">
                                <h4>Contato Direto</h4>
                                <p><strong>E-mail:</strong> {anuncio.email_usuario || "Não informado"}</p>
                                <p><strong>Telefone:</strong> {anuncio.telefone_usuario || "Não informado"}</p>
                            </div>
                        )}

                        <Link to={`/perfil/${anuncio.id_publicador}`} className="btn-link-profile">
                            Ver Perfil Completo
                        </Link>
                    </div>

                    <div className="cta-container">
                        {renderActionButton()}
                        {!statusCandidatura.candidatado && statusCandidatura.mensagem && (
                            <p className="error-message">{statusCandidatura.mensagem}</p>
                        )}
                    </div>
                </aside>
            </div>

            {anuncio.localizacao && (
                <Modal isOpen={isMapModalOpen} onClose={() => setMapModalOpen(false)}>
                    <h2>Localização do Serviço</h2>
                    <MoveableMap location={anuncio.localizacao} raio={0.01} />
                </Modal>
            )}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxImages}
                index={lightboxIndex}
            />
        </>
    );
};

export default AnuncioDetalhe;