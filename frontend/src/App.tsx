import { useEffect, useState } from 'react';
import { socket } from './services/socket';
import './App.scss';
import { SensorChart } from './components/SensorChart';
import { useI18n } from './i18n/i18n';
import { LanguageSelect } from './components/LanguageSelect';

const MAX_DATA_POINTS = 50;
const TIME_PER_SESSION = 5;

type Theme = 'light' | 'dark';
const THEME_KEY = 'theme';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  const prefersDark =
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;

  return prefersDark ? 'dark' : 'light';
}

function App() {
  const { t } = useI18n();

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const [connected, setConnected] = useState(false);
  const [dataHistory, setDataHistory] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const [myPosition, setMyPosition] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    socket.connect();

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
      setMyPosition(null);
    }

    function onQueueStatus(data: { myPosition: number; totalUsers: number }) {
      setMyPosition(data.myPosition);
      setTotalUsers(data.totalUsers);
    }

    function onSensorData(value: number) {
      const timeLabel = new Date().toLocaleTimeString();

      setDataHistory((prev) => {
        const newHistory = [...prev, value];
        if (newHistory.length > MAX_DATA_POINTS) return newHistory.slice(1);
        return newHistory;
      });

      setLabels((prev) => {
        const newLabels = [...prev, timeLabel];
        if (newLabels.length > MAX_DATA_POINTS) return newLabels.slice(1);
        return newLabels;
      });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue_status', onQueueStatus);
    socket.on('sensor_data', onSensorData);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue_status', onQueueStatus);
      socket.off('sensor_data', onSensorData);
      socket.disconnect();
    };
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: t('chart.transmitanceLabel'),
        data: dataHistory,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.15)',
        fill: true,
      },
    ],
  };

  const isMyTurn = myPosition === 0;
  const waitTime = myPosition !== null ? myPosition * TIME_PER_SESSION : 0;

  return (
    <main className="app">
      <header className="appHeader">
        <div className="titleBlock">
          <h1 className="title">{t('app.title')}</h1>
          <p className="subtitle">OpenTitrator • IoT • Realtime</p>
        </div>

        <div className="headerActions">
          <button
            className="themeToggle"
            onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <LanguageSelect />
        </div>
      </header>

      <section className="card">
        <div className="badges">
          <div className="badge">
            <span className="badgeLabel">{t('status.label')}</span>
            <span className={`badgeValue status ${connected ? 'online' : 'offline'}`}>
              {connected ? t('status.online') : t('status.offline')}
            </span>
          </div>

          <div className="badge">
            <span className="badgeLabel">{t('queue.positionLabel')}</span>
            <span className="badgeValue">
              {myPosition !== null ? `${myPosition + 1} / ${totalUsers}` : t('queue.placeholder')}
            </span>
          </div>

          <div className="badge">
            <span className="badgeLabel">{t('queue.estimatedWaitLabel')}</span>
            <span className={`badgeValue ${isMyTurn ? 'turnOk' : 'turnWait'}`}>
              {isMyTurn ? t('queue.yourTurn') : `${waitTime} ${t('time.minutesShort')}`}
            </span>
          </div>
        </div>
      </section>

      <section className="card chartCard">
        <div className="cardHeader">
          <h2 className="cardTitle">{t('chart.mainTitle')}</h2>
          <span className="cardHint">{t('chart.yAxisLabel')}</span>
        </div>

        <SensorChart chartData={chartData} />
      </section>

      <section className="card">
        <div className="buttons">
          <button
            className="btn primary"
            onClick={() => socket.emit('command', 'PUMP_500MS')}
            disabled={!connected || !isMyTurn}
          >
            {isMyTurn ? t('button.pumpHalfSecond') : t('button.pumpHalfSecondLocked')}
          </button>

          <button
            className="btn primary"
            onClick={() => socket.emit('command', 'PUMP_1000MS')}
            disabled={!connected || !isMyTurn}
          >
            {isMyTurn ? t('button.pumpOneSecond') : t('button.pumpOneSecondLocked')}
          </button>
        </div>
      </section>

      <section className="card instructionsCard">
        <div className="instructionsHeader">
          <h2 className="instructionsTitle">{t('instructions.title')}</h2>
          <span className="pill">{t('instructions.pill')}</span>
        </div>

        <div className="instructionsContent">
          <div className="instructionsContent" style={{marginTop: 15, marginBottom: 15}}>
            <p>{t('instructions.p1')}</p>
            <p>{t('instructions.p2')}</p>
            <p>{t('instructions.p3')}</p>
            <p>{t('instructions.p4')}</p>
            <p>{t('instructions.p5')}</p>

            <p className="sourceCredit">
              {t('instructions.sourcePrefix')}{' '}
              <a
                href="https://pt.wikipedia.org/wiki/Titulometria"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('instructions.sourceLinkText')}
              </a>
            </p>
          </div>

          <p>{t('instructions.p6')}</p>
          <p>{t('instructions.p7')}</p>
          <p>{t('instructions.p8')}</p>
          <p>{t('instructions.p9')}</p>
          <p>{t('instructions.p10')}</p>
        </div>
      </section>

      <footer className="appFooter">
        <div className="footerInfo">
          <span>© {new Date().getFullYear()} OpenTitrator-IoT</span>
          <span className="divider">•</span>
          <span>
            {t('footer.developedBy')}{' '}
            <a 
              href="https://github.com/FelipeSavazii" 
              target="_blank" 
              rel="noopener noreferrer"
              className="authorLink"
            >
              Felipe Savazi
            </a>
          </span>
        </div>

        <a 
          href="https://github.com/FelipeSavazii/OpenTitrator-IoT" 
          target="_blank" 
          rel="noopener noreferrer"
          className="githubBtn"
          aria-label="GitHub Repository"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          {t('footer.viewCode')}
        </a>
      </footer>    
    </main>
  );
}

export default App;