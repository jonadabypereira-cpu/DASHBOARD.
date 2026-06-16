import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GaugeChart = ({ faturamento, meta }) => {
  // Cálculo matemático real e dinâmico
  const percentual = meta > 0 ? (faturamento / meta) * 100 : 0;
  
  // Limita o preenchimento do gráfico a 100%, mas mantém o cálculo real
  const valorVisual = Math.min(Math.max(percentual, 0), 100);
  
  const data = [
    { value: valorVisual },
    { value: 100 - valorVisual }
  ];

  // Lógica de cores: Verde abaixo de 100, Dourado se bater a meta
  const COLORS = percentual >= 100 ? ['#FFD700', '#1a2a3a'] : ['#39ff14', '#1a2a3a'];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="80%"
          startAngle={180}
          endAngle={0}
          innerRadius={80}
          outerRadius={100}
          paddingAngle={0}
          dataKey="value"
          cornerRadius={10}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <text 
          x="50%" 
          y="70%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          style={{ fontSize: '28px', fontWeight: 'bold', fill: '#ffffff' }}
        >
          {percentual.toFixed(1)}%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GaugeChart;
