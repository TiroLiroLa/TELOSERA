import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AnuncioDetalhe.css'; // Importa o novo CSS
import Modal from '../components/Modal'; // Para o mapa
import MoveableMap from '../components/MoveableMap'; // Nosso mapa estático
import mapPinIcon from '../assets/map-pin.svg'; // <<< Importa o ícone

const AnuncioDetalhe = () => {
    const { id: idAnuncio } = useParams(); // Renomeia 'id' para 'idAnuncio' para clareza
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext); // <<< Pega o status de loading da auth
    const [anuncio, setAnuncio] = useState(null);
    const [loading, setLoading] = useState(true);

     // <<< 1. Novo estado para controlar o status da candidatura
    const [statusCandidatura, setStatusCandidatura] = useState({
        carregando: true,
        candidatado: false,
        mensagem: ''
    });

    useEffect(() => {
        const fetchAnuncio = async () => {
            try {
                setLoading(true);
                let params = new URLSearchParams();

                // <<< LÓGICA DE DISTÂNCIA
                if (isAuthenticated) {
                    try {
                        // Tenta buscar a localização do usuário logado
                        const resRegiao = await axios.get('/api/users/me/regiao');
                        const { lat, lng } = resRegiao.data;
                        params.append('lat', lat);
                        params.append('lng', lng);
                    } catch (error) {
                        console.log("Usuário sem região, não será possível calcular a distância.");
                    }
                }

                // Busca os detalhes do anúncio, passando os params (pode estar vazio)
                const res = await axios.get(`/api/anuncios/${idAnuncio}?${params.toString()}`);
                setAnuncio(res.data);

            } catch (err) {
                console.error("Erro ao buscar detalhes do anúncio:", err);
            } finally {
                setLoading(false);
            }
        };

        // Espera a autenticação carregar antes de buscar, para garantir que temos o token
        if (!authLoading) {
            fetchAnuncio();
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

    // <<< 3. Função para lidar com o clique no botão
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
                candidatado: false, // Continua não candidatado
                mensagem: err.response?.data?.msg || 'Erro ao se candidatar.',
                carregando: false
            });
        }
    };

    if (loading) return <div className="container">Carregando...</div>;
    if (!anuncio) return <div className="container">Anúncio não encontrado ou indisponível.</div>;
    const distanciaFormatada = formatDistance(anuncio.distancia);

    const isOwner = user?.id_usuario === anuncio?.id_usuario;

    // --- Lógica de renderização do botão de Ação ---
    const renderActionButton = () => {
        if (!isAuthenticated) {
            return (
                <Link to="/login" className="btn btn-primary btn-contact">
                    Faça login para se candidatar
                </Link>
            );
        }
        if (isOwner) {
            return <button className="btn btn-secondary btn-contact" disabled>Você é o dono deste anúncio</button>;
        }
        if (statusCandidatura.candidatado) {
            return <button className="btn btn-success btn-contact" disabled>{statusCandidatura.mensagem}</button>;
        }
        return (
            <button 
                onClick={handleCandidatar} 
                className="btn btn-primary btn-contact"
                disabled={statusCandidatura.carregando}
            >
                {statusCandidatura.carregando ? 'Enviando...' : 'Candidatar-se'}
            </button>
        );
    };

    // Formata a data do serviço para um formato legível
    const dataServicoFormatada = new Date(anuncio.data_servico).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const postadoEm = new Date(anuncio.data_publicacao).toLocaleDateString('pt-BR');

    return (
      <> 
        <div className="anuncio-detalhe-page">
            <main className="anuncio-main">
                <div className="anuncio-header">
                    <h1>{anuncio.titulo}</h1>
                    <p className="anuncio-subheader">
                        Postado por <Link to={`/perfil/${anuncio.id_usuario}`}>{anuncio.nome_usuario}</Link> em {postadoEm}
                        {anuncio.nome_cidade && (
                            <>
                                {' - '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setMapModalOpen(true); }}>
                                    {anuncio.nome_cidade}, {anuncio.uf_estado} 📍
                                </a>
                            </>
                        )}
                        {distanciaFormatada && (
                            <span className="card-location-tag" style={{marginLeft: '1rem'}}>
                                <img src={mapPinIcon} alt="Ícone de localização" />
                                <span>{distanciaFormatada}</span>
                            </span>
                        )}
                    </p>
                </div>
                
                {/* Futuramente, a galeria de imagens viria aqui */}

                <section className="anuncio-section">
                    <h2>Descrição</h2>
                    {/* Usamos <pre> para manter as quebras de linha da descrição */}
                    <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem'}}>{anuncio.descricao}</pre>
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

                        {/* <<< 3. Seção de Contato Direto */}
                        <div className="contact-details">
                            <h4>Contato Direto</h4>
                            <p><strong>E-mail:</strong> {anuncio.email_usuario || "Não informado"}</p>
                            <p><strong>Telefone:</strong> {anuncio.telefone_usuario || "Não informado"}</p>
                        </div>
                        
                        {/* <<< 4. Botão principal agora é "Acessar Perfil" */}
                        <Link to={`/perfil/${anuncio.id_usuario}`} className="btn btn-primary btn-contact">
                            Acessar Perfil Completo
                        </Link>
                        {/* <<< 4. Renderiza o botão de ação dinâmico */}
                        {renderActionButton()}
                        {/* Mostra mensagem de erro, se houver */}
                        {!statusCandidatura.candidatado && statusCandidatura.mensagem && (
                            <p style={{color: 'red', marginTop: '1rem'}}>{statusCandidatura.mensagem}</p>
                        )}
                    </div>
                </aside>
            </div>

            {/* <<< 5. O Modal do Mapa */}
            {anuncio.localizacao && (
                <Modal isOpen={isMapModalOpen} onClose={() => setMapModalOpen(false)}>
                    <h2>Localização do Serviço</h2>
                    {/* Usamos um raio fixo pequeno (ex: 0.5 km) apenas para centralizar o marcador */}
                    <MoveableMap location={anuncio.localizacao} raio={0.01} />
                </Modal>
            )}
        </>
    );
};

export default AnuncioDetalhe;