import { DataProvider } from './lib/data';
import { useRoute } from './lib/router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Standings from './pages/Standings';
import Calendar from './pages/Calendar';
import Players from './pages/Players';
import Player from './pages/Player';
import Teams from './pages/Teams';
import Team from './pages/Team';
import Game from './pages/Game';
import { Empty } from './components/ui';

function Router() {
  const [section = '', a, b] = useRoute();
  let page;
  switch (section) {
    case '':
      page = <Home />;
      break;
    case 'classifica':
      page = <Standings />;
      break;
    case 'calendario':
      page = <Calendar />;
      break;
    case 'giocatori':
      page = <Players />;
      break;
    case 'giocatore':
      page = <Player team={a} name={b} />;
      break;
    case 'squadre':
      page = <Teams />;
      break;
    case 'squadra':
      page = <Team id={a} />;
      break;
    case 'partita':
      page = <Game id={a} />;
      break;
    default:
      page = <Empty>Pagina non trovata.</Empty>;
  }
  return (
    <Layout section={section}>
      <div key={`${section}/${a ?? ''}/${b ?? ''}`} className="page-enter">
        {page}
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Router />
    </DataProvider>
  );
}
