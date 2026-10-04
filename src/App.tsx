import { useCallback, useState } from 'react';
import type { Navigate, Screen } from './ui/navigation';
import { HomeScreen } from './ui/screens/HomeScreen';
import { LiveMatchScreen } from './ui/screens/LiveMatchScreen';
import { NewMatchScreen } from './ui/screens/NewMatchScreen';
import { TeamEditorScreen } from './ui/screens/TeamEditorScreen';
import { TeamsScreen } from './ui/screens/TeamsScreen';

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  const navigate: Navigate = useCallback((next) => {
    setScreen(next);
    window.scrollTo(0, 0);
  }, []);

  switch (screen.name) {
    case 'home':
      return <HomeScreen navigate={navigate} />;
    case 'teams':
      return <TeamsScreen navigate={navigate} />;
    case 'team-editor':
      return <TeamEditorScreen navigate={navigate} teamId={screen.teamId} />;
    case 'new-match':
      return <NewMatchScreen navigate={navigate} />;
    case 'match':
      return <LiveMatchScreen navigate={navigate} matchId={screen.matchId} />;
  }
}
