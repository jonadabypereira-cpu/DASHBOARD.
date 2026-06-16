import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GaugeChart = ({ percentual }) => {
  // Garante que o gráfico não quebre e exibe o preenchimento total se > 100
  const valorVisual = Math.min(Math.max(percentual, 0), 100);
  
  const data = [
    { value: valorVisual },
    { value: 100 - valorVisual }
  ];

  // Se bateu a meta (ou passou), muda a cor para Destaque/Ouro
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
          style={{ fontSize: '30px', fontWeight: 'bold', fill: '#ffffff' }}
        >
          {/* Exibe o valor real, não o visual limitado */}
          {percentual}%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};
