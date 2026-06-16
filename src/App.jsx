import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import GaugeChart from './GaugeChart';
import RankingCard from './RankingCard';
import './App.css';
import DesvioChart from './DesvioChart';

const API_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbxTjGxybDbkXqU9RF9sJKw2N5X051JZjByCvYsxqFsTDeUiC5QrpyzOwwD0281dCIYA/exec';
console.log("URL de Conexão do Axios:", API_URL);

const parseBrazilianCurrency = (valor) => {
  if (!valor) return 0;
  const limpo = valor.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
};

const processarDadosParaGrafico = (dados, metaMensal) => {
  if (!dados || dados.length < 2) return [];
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const vendasPorDia = {};
  const COL_FATURAMENTO = 4;

  dados.slice(1).forEach((row) => {
    const rawDate = row[0];
    if (!rawDate) return;
    const [diaStr, mesStr, anoStr] = rawDate.split('/');
    const dia = parseInt(diaStr, 10);
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);
    if (mes === mesAtual && ano === anoAtual) {
      const valor = parseBrazilianCurrency(row[COL_FATURAMENTO]);
      vendasPorDia[dia] = (vendasPorDia[dia] || 0) + valor;
    }
  });

  const ultimoDiaDoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const metaDiaria = metaMensal / ultimoDiaDoMes;
  let acumuladoReal = 0;
  const resultadoFinal = [];
  for (let i = 1; i <= ultimoDiaDoMes; i++) {
    acumuladoReal += (vendasPorDia[i] || 0);
    resultadoFinal.push({ dia: i.toString(), meta: Math.round(metaDiaria * i), alcancado: Math.round(acumuladoReal) });
  }
  return resultadoFinal;
};

function App() {
  const [topFaturamento, setTopFaturamento] = useState([]);
  const [topLigacoes, setTopLigacoes] = useState([]);
  const [nomeDestaque, setNomeDestaque] = useState("Aguardando...");
  const [dados, setDados] = useState([]);
  const [metaMensal, setMetaMensal] = useState(0);
  const [totalFaturamento, setTotalFaturamento] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualEndTime, setManualEndTime] = useState(null);
  const [status, setStatus] = useState({ blocoAtual: "Aguardando...", tempoRestante: "00:00", porcentagem: 0, mensagem: "Clique em INICIAR" });

  // Áudio inicializado de forma preguiçosa (não recria a cada render)
  const startSound = useRef(null);
  const endSound = useRef(null);
  if (!startSound.current) startSound.current = new Audio('/start.mp3');
  if (!endSound.current) endSound.current = new Audio('/end.mp3');
  const hasPlayedEndSound = useRef(false);

  const blocos = [
    { nome: "1º BLOCO - Qualificação", inicio: "09:00", fim: "10:00" },
    { nome: "2º BLOCO - Potenciais", inicio: "10:30", fim: "11:30" },
    { nome: "3º BLOCO - Qualificação", inicio: "13:45", fim: "14:45" },
    { nome: "4º BLOCO - Potenciais", inicio: "15:00", fim: "16:00" },
    { nome: "5º BLOCO - Hibrido", inicio: "16:30", fim: "17:30" },
  ];

  const percentualMeta = metaMensal > 0 ? Math.min(100, Math.round((totalFaturamento / metaMensal) * 100)) : 0;

  // Só recalcula o gráfico quando os dados ou a meta mudam — não a cada segundo do relógio
  const dadosGrafico = useMemo(
    () => processarDadosParaGrafico(dados, metaMensal),
    [dados, metaMensal]
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const carregarDados = async () => {
    try {
      // O Google entende parâmetros após o '?'
      const resposta = await axios.get(`${API_URL}?action=dados`);
      if (Array.isArray(resposta.data) && resposta.data.length > 1) {
        setDados(resposta.data);
        const linhaDados = resposta.data[1];
        setMetaMensal(parseBrazilianCurrency(linhaDados[15]));
        setTotalFaturamento(parseBrazilianCurrency(linhaDados[16]));
      }
    } catch (error) { console.error("ERRO AO CARREGAR:", error); }
  };

  // Carrega ao montar e recarrega a cada 30 segundos
  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  // Processa os dados: ranking de faturamento e média de ligações por comercial
  useEffect(() => {
    if (!dados || dados.length <= 1) return;

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const num = (v) => Number(v) || 0;

    // "dd/MM/yyyy" (ou com hora) -> { mes, ano, chave do dia normalizada }
    const parseData = (raw) => {
      if (!raw) return null;
      const [d, m, a] = raw.toString().split('/');
      const dia = parseInt(d, 10), mes = parseInt(m, 10), ano = parseInt(a, 10);
      if (!dia || !mes || !ano) return null;
      return { mes, ano, chave: `${dia}/${mes}/${ano}` };
    };

    const faturamentoMes = {};         // faturamento do mês por comercial (chave: nome em MAIÚSCULAS)
    const efetivasPorComercial = {};   // soma das efetivas (b1..b5) no mês atual
    const metaPorComercial = {};       // tabela Q (meta) x R (nome) -> meta individual
    const diasEquipe = new Set();      // dias distintos em que a equipe lançou algo no mês
    let destaqueEncontrado = "Nenhum";

    const chaveNome = (n) => n.toString().trim().toUpperCase();

    dados.slice(1).forEach((row) => {
      const nome = row[1];
      const dt = parseData(row[0]);
      const noMes = dt && dt.mes === mesAtual && dt.ano === anoAtual;

      // Tabela de metas individuais (coluna Q = meta, coluna R = nome) — independe de data
      const nomeMeta = row[17];
      if (nomeMeta && nomeMeta.toString().trim() !== "") {
        metaPorComercial[chaveNome(nomeMeta)] = parseBrazilianCurrency(row[16]);
      }

      // Dia distinto da equipe (qualquer lançamento do mês conta)
      if (noMes) diasEquipe.add(dt.chave);

      if (nome && noMes) {
        const k = chaveNome(nome);
        // Faturamento do mês por comercial
        if (!faturamentoMes[k]) faturamentoMes[k] = { nome, fat: 0 };
        faturamentoMes[k].fat += parseBrazilianCurrency(row[4]);

        // Efetivas do mês por comercial (soma dos blocos b1..b5 = índices 5 a 9)
        if (!efetivasPorComercial[k]) efetivasPorComercial[k] = { nome, ef: 0 };
        efetivasPorComercial[k].ef += num(row[5]) + num(row[6]) + num(row[7]) + num(row[8]) + num(row[9]);
      }

      const dest = row[13];
      if (dest && dest.toString().trim() !== "" && dest !== "0" && isNaN(dest)) {
        destaqueEncontrado = dest;
      }
    });

    // --- TOP FATURAMENTO (% da meta individual de cada um) ---
    const listaFat = Object.keys(faturamentoMes).map((k) => {
      const meta = metaPorComercial[k] || 0;
      const pct = meta > 0 ? (faturamentoMes[k].fat / meta) * 100 : 0;
      return { nome: faturamentoMes[k].nome, pct: Math.round(pct) };
    });
    if (listaFat.length > 0) {
      const rankingFat = listaFat.sort((a, b) => b.pct - a.pct);
      setTopFaturamento(rankingFat.slice(0, 3).map(i => ({
        nome: i.nome,
        valor: Math.min(100, Math.max(0, i.pct)), // largura da barra (limitada a 100%)
        total: `${i.pct}%`,                        // rótulo: % real (pode passar de 100%)
      })));
    }

    // --- TOP MÉDIA DE LIGAÇÕES (divisor único = dias da equipe no mês) ---
    const diasDaEquipe = diasEquipe.size || 1; // nunca divide por zero
    const listaMedia = Object.keys(efetivasPorComercial).map((k) => ({
      nome: efetivasPorComercial[k].nome,
      media: efetivasPorComercial[k].ef / diasDaEquipe,
    }));
    if (listaMedia.length > 0) {
      const rankingMedia = listaMedia.sort((a, b) => b.media - a.media);
      const maxMedia = rankingMedia[0].media || 1;
      setTopLigacoes(rankingMedia.slice(0, 3).map(i => ({
        nome: i.nome,
        valor: i.media > 0 ? Math.round((i.media / maxMedia) * 100) : 0,
        total: i.media.toFixed(1), // média com 1 casa
      })));
    }

    setNomeDestaque(destaqueEncontrado);
  }, [dados]);

  const calcularTempo = () => {
    const agora = new Date();
    let horaFim = null;
    let nomeBloco = "";

    if (manualEndTime) {
      horaFim = manualEndTime;
      nomeBloco = "SESSÃO MANUAL";
    } else {
      const tempoDecimal = agora.getHours() + (agora.getMinutes() / 60);
      const blocoAtual = blocos.find(b => {
        const [hI, mI] = b.inicio.split(':').map(Number);
        const [hF, mF] = b.fim.split(':').map(Number);
        return tempoDecimal >= (hI + mI / 60) && tempoDecimal < (hF + mF / 60);
      });
      if (blocoAtual) {
        const [hF, mF] = blocoAtual.fim.split(':').map(Number);
        horaFim = new Date();
        horaFim.setHours(hF, mF, 0, 0);
        nomeBloco = blocoAtual.nome;
      }
    }

    if (horaFim) {
      const diff = horaFim - agora;
      if (diff <= 0) {
        if (!hasPlayedEndSound.current) {
          endSound.current.play().catch(e => console.log("Áudio bloqueado", e));
          hasPlayedEndSound.current = true;
        }
        setManualEndTime(null);
        return;
      }
      hasPlayedEndSound.current = false;
      const minutos = Math.floor((diff / 1000 / 60) % 60);
      const segundos = Math.floor((diff / 1000) % 60);
      const progresso = 100 - ((diff / (60 * 60 * 1000)) * 100);
      setStatus({ blocoAtual: nomeBloco, tempoRestante: `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`, porcentagem: Math.min(100, Math.max(0, progresso)), mensagem: "" });
    } else {
      setStatus({ blocoAtual: "INTERVALO", tempoRestante: "00:00", porcentagem: 100, mensagem: "Se prepare para o próximo bloco!" });
    }
  };

  useEffect(() => {
    if (isPaused) return;
    calcularTempo();
    const timer = setInterval(calcularTempo, 1000);
    return () => clearInterval(timer);
  }, [isPaused, manualEndTime]);

  const handleIniciar = () => {
    setIsPaused(false);
    hasPlayedEndSound.current = false;
    setManualEndTime(new Date(Date.now() + 60 * 60 * 1000));
    startSound.current.play().catch(e => console.log("Áudio bloqueado", e));
  };

  const handleReiniciar = () => {
    setManualEndTime(null);
    setIsPaused(false);
    setStatus({ blocoAtual: "Aguardando...", tempoRestante: "00:00", porcentagem: 0, mensagem: "Sistema reiniciado" });
    carregarDados();
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-left"><img src="/logo.png" alt="Logo" className="logo-img" /></div>
        <div className="header-center">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div className="header-right">THE PROCESS</div>
      </header>

      <div className="grid-main">
        <section className="card bloco-atual-container">
          <h2>BLOCO ATUAL</h2>
          <h1 className="timer-title">{status.blocoAtual}</h1>
          <div className="big-timer">{status.tempoRestante}</div>
          <div className="barra-progresso"><div className="fill" style={{ width: `${status.porcentagem}%` }}></div></div>
          <p className="mensagem">{status.mensagem}</p>
          <div className="btn-group">
            <button className="btn btn-iniciar" onClick={handleIniciar}>INICIAR</button>
            <button className="btn btn-pausar" onClick={() => setIsPaused(true)}>PAUSAR</button>
            <button className="btn btn-reiniciar" onClick={handleReiniciar}>REINICIAR</button>
          </div>
        </section>

        <section className="card performance-section">
          <h2>DESEMPENHO DO TIME COMERCIAL</h2>
          <div className="perf-layout">
            <div className="gauge-side"><GaugeChart percentual={percentualMeta} /><p>{percentualMeta >= 100 ? "META BATIDA!" : "META EQUIPE"}</p></div>
            <div className="chart-side"><DesvioChart dados={dadosGrafico} /></div>
          </div>
        </section>
      </div>

      <div className="bottom-row">
        <div className="card"><h3>🏆 TOP 3 FATURAMENTO</h3><div className="bar-chart-container">{topFaturamento.map((item, index) => (<div key={index} className="bar-row"><span className="ranking-nome">{item.nome}</span><div className="bar-bg"><div className="bar-fill" style={{width: `${item.valor}%`}}></div></div><span>{item.total}</span></div>))}</div></div>
        <div className="card"><h3>📞 TOP MÉDIA DE LIGAÇÕES</h3><div className="bar-chart-container">{topLigacoes.map((item, index) => (<div key={index} className="bar-row"><span className="ranking-nome">{item.nome}</span><div className="bar-bg"><div className="bar-fill" style={{width: `${item.valor}%`}}></div></div><span>{item.total}</span></div>))}</div></div>
        <div className="card card-destaque"><h3>⭐ DESTAQUE DA SEMANA</h3><div className="trophy-icon">🏆</div><h2 style={{margin: '10px 0'}}>{nomeDestaque}</h2></div>
      </div>
    </div>
  );
}
export default App;
