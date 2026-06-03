import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DesvioChart = ({ dados }) => {
  // Debug visual: se o dado estiver vazio, vamos logar para você ver
  console.log("DADOS RECEBIDOS NO COMPONENTE:", dados);

  if (!dados || dados.length === 0) {
    return <div style={{ color: '#888', padding: '20px' }}>Sem dados processados</div>;
  }

  return (
    <div style={{ width: '100%', height: '200px' }}>
      <ResponsiveContainer>
        <LineChart data={dados} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="dia" stroke="#ffffff" fontSize={15} />
          {/* 'auto' ajusta a escala automaticamente para seus valores reais */}
          <YAxis stroke="#ffffff" fontSize={15} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
          
          <Line type="monotone" dataKey="meta" stroke="#39ff14" strokeDasharray="5 5" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="alcancado" stroke="#39ff14" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DesvioChart;