import React from 'react'; // Adicione isto, caso falte no seu arquivo
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GaugeChart = ({ percentual }) => {
  // Tratamento de segurança: se percentual for undefined/null, assume 0
  const valorReal = percentual || 0;
  
  // Impede que o gráfico quebre com valores negativos ou acima de 100
  const valorVisual = Math.min(Math.max(valorReal, 0), 100);
  
  const data = [
    { value: valorVisual },
    { value: 100 - valorVisual }
  ];

  // Cores: Verde se abaixo da meta, Dourado se meta batida (>=100)
  const COLORS = valorReal >= 100 ? ['#FFD700', '#1a2a3a'] : ['#39ff14', '#1a2a3a'];

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
          stroke="none" // Remove a borda padrão para ficar mais limpo
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
          style={{ fontSize: '30px', fontWeight: 'bold', fill: '#ffffff' }}
        >
          {valorReal.toFixed(0)}%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GaugeChart;
