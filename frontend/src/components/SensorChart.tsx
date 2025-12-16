import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { useI18n } from '../i18n/i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface SensorChartProps {
  chartData?: any;
}

const defaultData = {
  labels: [],
  datasets: [],
};

export function SensorChart({ chartData }: SensorChartProps) {
  const { t } = useI18n();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    
    plugins: {
      legend: { position: 'top' as const },
      title: { 
        display: true, 
        text: t('chart.mainTitle') 
      },
    },
    scales: {
      y: {
        min: 0,
        max: 4095, 
        title: { 
          display: true, 
          text: t('chart.yAxisLabel')
        }
      },
      x: {
        ticks: { display: false }
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hitRadius: 10 } 
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}> 
      <Line options={options} data={chartData || defaultData} />
    </div>
  );
}