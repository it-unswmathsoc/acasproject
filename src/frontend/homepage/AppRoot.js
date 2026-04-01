import { AuthProvider } from '../user/AuthContext';
import { DataProvider } from '../user/DataContext';
import AppRouter from './AppRouter';
import '../../App.css';

export default function AppRoot() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppRouter />
      </DataProvider>
    </AuthProvider>
  );
}
