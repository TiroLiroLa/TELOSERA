
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Tabs, Tab } from '../components/Tabs';
import AnuncioDashboardCard from '../components/AnuncioDashboardCard';
import './Dashboard.css';
import AvaliacaoModal from '../components/AvaliacaoModal';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [publicados, setPublicados] = useState([]);
    const [candidaturas, setCandidaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmados, setConfirmados] = useState([]);
    const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
    const [avaliacaoTarget, setAvaliacaoTarget] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [resPublicados, resCandidaturas, resMeusConfirmados, resTrabalhosConfirmados] = await Promise.all([
                axios.get('/api/anuncios/meus-publicados'),
                axios.get('/api/anuncios/minhas-candidaturas'),
                axios.get('/api/anuncios/meus-confirmados'),
                axios.get('/api/anuncios/trabalhos-confirmados')
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