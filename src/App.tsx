import { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  Lock, Github, LogOut, RefreshCw, 
  FileText, TrendingUp, Calendar, Loader2 
} from 'lucide-react';
import { GitHubService } from './lib/github';
import type { SyncStats, AuthData } from './lib/github';

function App() {
  const [config, setConfig] = useState({
    owner: localStorage.getItem('gh_owner') || '',
    repo: localStorage.getItem('gh_repo') || '',
    token: localStorage.getItem('gh_token') || '',
  });
  const [isConfigured, setIsConfigured] = useState(!!(config.owner && config.repo && config.token));
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gh = useMemo(() => new GitHubService(config.owner, config.repo, config.token), [config]);

  useEffect(() => {
    if (isConfigured) {
      checkStatus();
    }
  }, [isConfigured]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const authData = await gh.checkAuth();
      setAuth(authData);
      if (authData) {
        // If already logged in this session
        const sessionLogin = sessionStorage.getItem('isLoggedIn');
        if (sessionLogin === 'true') {
          setIsLoggedIn(true);
          fetchData();
        }
      }
    } catch (err: any) {
      setError('Failed to connect to GitHub. Please check your settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await gh.getStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch stats.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('gh_owner', config.owner);
    localStorage.setItem('gh_repo', config.repo);
    localStorage.setItem('gh_token', config.token);
    setIsConfigured(true);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    setLoading(true);
    if (await gh.verifyLogin(password)) {
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      fetchData();
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  };

  const handleInitialize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    setLoading(true);
    try {
      await gh.initializeAuth(password, email);
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      fetchData();
    } catch (err) {
      setError('Failed to initialize.');
    }
    setLoading(false);
  };

  const chartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [stats]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <Github className="w-12 h-12 mx-auto text-gray-900" />
            <h1 className="mt-4 text-2xl font-bold">Configure GitHub</h1>
            <p className="text-gray-500 mt-2">Enter your repository details to get started.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner</label>
              <input 
                type="text" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={config.owner}
                onChange={e => setConfig({...config, owner: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Repository</label>
              <input 
                type="text" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={config.repo}
                onChange={e => setConfig({...config, repo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Personal Access Token</label>
              <input 
                type="password" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={config.token}
                onChange={e => setConfig({...config, token: e.target.value})}
              />
            </div>
            <button 
              onClick={handleSaveConfig}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition"
            >
              Connect Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto text-blue-600" />
            <h1 className="mt-4 text-2xl font-bold">{auth ? 'Login' : 'Initialize Dashboard'}</h1>
            <p className="text-gray-500 mt-2">
              {auth ? 'Enter your dashboard password.' : 'Set up your admin account.'}
            </p>
          </div>

          <form onSubmit={auth ? handleLogin : handleInitialize} className="space-y-4">
            {!auth && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Recovery Email</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="For password recovery"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition"
            >
              {auth ? 'Login' : 'Initialize'}
            </button>
            {auth && (
              <button 
                type="button"
                onClick={() => alert(`Password recovery hint: Your recovery email is ${auth.email}. Since this is a static site, please manually check your GitHub auth.json file if you forgot your password.`)}
                className="w-full text-xs text-blue-500 hover:underline mt-2"
              >
                Forgot Password?
              </button>
            )}
          </form>

          <button 
            onClick={() => setIsConfigured(false)}
            className="w-full text-gray-500 text-sm hover:underline"
          >
            Change Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              <span className="text-xl font-bold">Sync Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchData} className="p-2 text-gray-500 hover:text-blue-600 transition">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  sessionStorage.removeItem('isLoggedIn');
                }} 
                className="p-2 text-gray-500 hover:text-red-600 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Word Count</p>
              <p className="text-2xl font-bold">
                {chartData.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Calendar className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Month</p>
              <p className="text-2xl font-bold">
                {chartData[chartData.length - 1]?.count.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Sync</p>
              <p className="text-sm font-bold">
                {stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6">Monthly Growth Trend</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
