import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AnuncioDetalhe.css'; // Importa o novo CSS
import Modal from '../components/Modal'; // Para o mapa
import MoveableMap from '../components/MoveableMap'; // Nosso mapa estático

const AnuncioDetalhe = () => {
    const { id } = useParams();
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [anuncio, setAnuncio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnuncio = async () => {
            try {
                const res = await axios.get(`/api/anuncios/${id}`);
                console.log("DADOS DO ANÚNCIO RECEBIDOS:", res.data); // <<< ADICIONE ESTA LINHA
                setAnuncio(res.data);
            } catch (err) {
                console.error("Erro ao buscar detalhes do anúncio:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnuncio();
    }, [id]);

    if (loading) return <div className="container">Carregando...</div>;
    if (!anuncio) return <div className="container">Anúncio não encontrado ou indisponível.</div>;

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