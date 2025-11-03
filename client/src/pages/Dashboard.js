
import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Tabs, Tab } from '../components/Tabs';
import AnuncioDashboardCard from '../components/AnuncioDashboardCard';
import './Dashboard.css';
import AvaliacaoModal from '../components/AvaliacaoModal';
import { useHelp } from '../context/HelpContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [publicados, setPublicados] = useState([]);
    const [candidaturas, setCandidaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmados, setConfirmados] = useState([]);
    const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
    const [avaliacaoTarget, setAvaliacaoTarget] = useState(null);
    const { setHelpContent, revertHelpContent } = useHelp();

    useEffect(() => {
        setHelpContent({
            title: 'Ajuda: Meu Painel',
            content: [
                { item: 'Meus Anúncios Publicados', description: 'Aqui você vê os anúncios que criou. Clique em "Gerenciar" para ver os candidatos.' },
                { item: 'Confirmados', description: 'Lista de trabalhos que você contratou ou para os quais foi contratado. Se uma avaliação estiver pendente, o botão "Avaliar" aparecerá.' },
                { item: 'Minhas Candidaturas', description: 'Anúncios aos quais você se candidatou e que ainda estão ativos.' },
                { item: 'Avaliação', description: 'Após um serviço ser finalizado, você pode avaliar a outra parte (contratante ou prestador). Sua avaliação é importante para a comunidade.' },
            ]
        });
    }, [setHelpContent]);

    // Ajuda para o Modal de Avaliação
    useEffect(() => {
        if (isAvaliacaoModalOpen) {
            setHelpContent({
                title: 'Ajuda: Avaliação de Serviço',
                content: [
                    { item: 'Avaliação', description: 'Dê uma nota de 1 a 5 estrelas para cada critério. Seja justo e honesto, sua avaliação ajuda toda a comunidade.' },
                    { item: 'Comentário', description: 'Deixe um comentário detalhando sua experiência. Isso fornece um contexto valioso para outros usuários.' },
                    { item: 'Critérios (Prestador)', description: 'Avalie a "Satisfação Geral" com o trabalho e a "Pontualidade" do profissional.' },
                    { item: 'Critérios (Contratante)', description: 'Avalie a "Clareza da Demanda" (se as instruções foram boas) e o "Pagamento" (se foi realizado corretamente).' },
                ]
            });
        }
        return () => {
            if (isAvaliacaoModalOpen) revertHelpContent(); // This line was causing an error if revertHelpContent was not imported
        };
    }, [isAvaliacaoModalOpen, setHelpContent, revertHelpContent]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [resPublicados, resCandidaturas, resMeusConfirmados, resTrabalhosConfirmados] = await Promise.all([
                api.get('/api/anuncios/meus-publicados'),
                api.get('/api/anuncios/minhas-candidaturas'),
                api.get('/api/anuncios/meus-confirmados'),
                api.get('/api/anuncios/trabalhos-confirmados')
            ]);
            setPublicados(resPublicados.data);
            setCandidaturas(resCandidaturas.data);
            setConfirmados([...resMeusConfirmados.data, ...resTrabalhosConfirmados.data]);
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) { fetchDashboardData(); }
    }, [user, fetchDashboardData]);

    if (loading) return <div>Carregando painel...</div>;

    const handleOpenAvaliacaoModal = (anuncioConfirmado) => {
        setAvaliacaoTarget(anuncioConfirmado);
        setIsAvaliacaoModalOpen(true);
    };

    const handleAvaliacaoSuccess = () => {
        setIsAvaliacaoModalOpen(false);
        setAvaliacaoTarget(null);
        fetchDashboardData();
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Meu Painel</h1>
                <p>Gerencie seus anúncios e candidaturas em um só lugar.</p>
            </div>

            <Tabs>
                <Tab label={`Meus Anúncios Publicados (${publicados.length})`}>
                    {publicados.length > 0 ? (
                        publicados.map(anuncio => (
                            <AnuncioDashboardCard key={anuncio.id_anuncio} anuncio={anuncio} tipo="publicado" />
                        ))
                    ) : (
                        <p>Você ainda não publicou nenhum anúncio.</p>
                    )}
                </Tab>
                <Tab label={`Confirmados (${confirmados.length})`}>
                    {confirmados.length > 0 ? (
                        confirmados.map(item => (
                            <AnuncioDashboardCard key={`conf-${item.id_anuncio}`} anuncio={item} tipo="confirmado" onAvaliarClick={handleOpenAvaliacaoModal} />
                        ))
                    ) : (
                        <p>Nenhum serviço confirmado ainda.</p>
                    )}
                </Tab>
                <Tab label={`Minhas Candidaturas (${candidaturas.length})`}>
                    {candidaturas.length > 0 ? (
                        candidaturas.map(item => (
                            <AnuncioDashboardCard key={item.id_anuncio} anuncio={item} tipo="candidatura" />
                        ))
                    ) : (
                        <p>Você ainda não se candidatou a nenhum anúncio.</p>
                    )}
                </Tab>
            </Tabs>
            <AvaliacaoModal
                isOpen={isAvaliacaoModalOpen}
                onClose={() => setIsAvaliacaoModalOpen(false)}
                avaliacaoTarget={avaliacaoTarget}
                onSuccess={handleAvaliacaoSuccess}
            />
        </div>
    );
};

export default Dashboard;