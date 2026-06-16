import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GaugeChart = ({ percentual }) => {
  const data = [
    { value: percentual },
    { value: 100 - percentual }
  ];

  const COLORS = ['#39ff14', '#1a2a3a'];

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
        {/* Adicionando o texto centralizado dentro do gráfico */}
        <text 
          x="50%" 
          y="70%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          style={{ fontSize: '45px', fontWeight: 'bold', fill: '#ffffff' }}
        >
          {percentual}%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default GaugeChart;
