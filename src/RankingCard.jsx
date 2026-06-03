const RankingCard = ({ titulo, dados, chaveValor, icone }) => {
  // Ordena de forma segura
  const top3 = [...dados]
    .sort((a, b) => (b[chaveValor] || 0) - (a[chaveValor] || 0))
    .slice(0, 3);

  return (
    <div className="card">
      <h3>{icone} {titulo}</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {top3.length > 0 ? (
          top3.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2a3a', paddingBottom: '5px' }}>
              <span>{index + 1}º {item.nome || 'Sem Nome'}</span>
              <span style={{ color: '#39ff14', fontWeight: 'bold' }}>
                {/* Verifica se é número para formatar, senão exibe direto */}
                {typeof item[chaveValor] === 'number' ? item[chaveValor].toLocaleString('pt-BR') : (item[chaveValor] || 0)}
              </span>
            </li>
          ))
        ) : (
          <p style={{ color: '#666', textAlign: 'center' }}>Sem dados no momento</p>
        )}
      </ul>
    </div>
  );
};

export default RankingCard;